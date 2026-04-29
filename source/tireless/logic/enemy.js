import 
{
    Component,
    GameObject,
    SpriteRenderer,
    Sprite,
    Animator,
    AnimationClip,
    AABB,
    Timer,
    AudioPlayer,
    Vector2,
    Engine
} from "/source/engine/rebound.js";

import
{
    PlayerOnlyCollider,
    WaterCollider
} from "/source/tireless/tireless.js";

import
{
    InteractableCollider
} from "/source/tireless/logic/interactables.js";

import 
{
    LivingEntity
} from "/source/tireless/logic/livingEntity.js";

import
{
    PlayerCollider
} from "/source/tireless/logic/player.js";

import
{
    DeathParticle,
    BloodParticle,
    EnemyStunParticle,
    RangedEnemyMuzzleFlashParticle,
    DashParticle
} from "/source/tireless/logic/particles.js";

import
{
    EnemyHealthUI,
    BossEnemyHealthUI
} from "/source/tireless/logic/UI.js";

// Collider that handles dash attack logic for the standard enemy type

export class EnemyCollider extends AABB
{
    constructor(gameObject, dimensions)
    {
        super(gameObject, dimensions);

        this.ignoreTypes = [PlayerOnlyCollider, InteractableCollider];
        this.epsilon = 1;
    }

    Update()
    {
        this.gameObject.scene.colliderManager.Compare(this);
    }

    OnCollisionDetected(_other)
    {
        // Get difference between collider positions

        const _delta = new Vector2(
            _other.gameObject.transform.position.x - this.gameObject.transform.position.x,
            _other.gameObject.transform.position.y - this.gameObject.transform.position.y
        )

        // Calculate collision penetration depth

        const _penDepth = new Vector2(
            (this.dimensions.x / 2 + _other.dimensions.x / 2) - Math.abs(_delta.x), 
            (this.dimensions.y / 2 + _other.dimensions.y / 2) - Math.abs(_delta.y)
        );

        // Target axis with smallest penetration depth, then push this GameObject out of the collider along that axis

        if (_penDepth.x < _penDepth.y)
        {
            this.gameObject.transform.localPosition.x -= (_penDepth.x + this.epsilon) * Math.sign(_delta.x);
        }

        else
        {
            this.gameObject.transform.localPosition.y -= (_penDepth.y + this.epsilon) * Math.sign(_delta.y);
        }

        if (_other instanceof PlayerCollider)
        {
            if (this.enemy == undefined)
            {
                this.enemy = this.gameObject.GetComponent(EnemyController);
            }

            if (!this.enemy.stunned && this.enemy.dashing)
            {
                this.enemy.player.controller.Damage(25);
            }

            this.enemy.dashing = false;
            this.enemy.dashTarget = null;
        }
    }
}

// Simple timer that triggers the enemy dash attack upon completion

export class EnemyDashTimer extends Timer
{
    constructor(gameObject, startValue=1, autoPlay=false, destructive=false)
    {
        super(gameObject, startValue, autoPlay, destructive);
    }

    OnTimerPlay()
    {
        if (this.particle != null) { this.particle.Base_Destroy(); }

        this.particle = new DashParticle(this.gameObject.scene, this.gameObject.transform);
        this.particle.transform.localPosition = Vector2.zero;
    }

    OnTimerUp()
    {
        if (this.enemy == undefined)
        {
            this.enemy = this.gameObject.GetComponent(EnemyController);
        }

        if (!this.enemy.dashing) { this.enemy.dashing = true; this.enemy.dashSFX.Stop(); this.enemy.dashSFX.Play(); }

        else
        {
            this.enemy.dashing = false;
            this.enemy.dashTarget = null;
        }
    }
}

// Simple timer that disables the enemy stun effect upon completion

export class EnemyStunTimer extends Timer
{
    constructor(gameObject, startValue=3.5, autoPlay=false, destructive=false)
    {
        super(gameObject, startValue, autoPlay, destructive);
    }

    OnTimerUp()
    {
        if (this.enemy == undefined)
        {
            this.enemy = this.gameObject.GetComponent(EnemyController);
        }

        this.enemy.stunned = false;

        this.enemy.dashTimer.Stop();
    }
}

// Complex handler for the enemy's behaviour. Dashes towards the enemy, can be parried or blocked

export class EnemyController extends LivingEntity
{
    constructor(gameObject)
    {
        super(gameObject);

        this.player = this.gameObject.scene.player;

        this.dashTimer = this.gameObject.AddComponent(EnemyDashTimer);
        this.stunTimer = this.gameObject.AddComponent(EnemyStunTimer);

        this.speed = 100;
        this.dashSpeed = 300;

        this.detectRange = 144;
        this.attackRange = 64;

        this.animator = this.gameObject.GetComponent(Animator);
        this.col = this.gameObject.GetComponent(EnemyCollider);

        this.healthUI = new EnemyHealthUI(this.gameObject.scene, "EnemyHealthUI", this.gameObject.transform);
        this.healthUI.transform.localPosition = new Vector2(0, 28);

        this.damageSFX = this.gameObject.AddComponent(AudioPlayer, "source/tireless/resources/audio/Shared/Tireless_EnemyDamaged.wav", Engine.I.sfxMixer);
        this.dashSFX = this.gameObject.AddComponent(AudioPlayer, "source/tireless/resources/audio/Shared/Tireless_Dash.wav", Engine.I.sfxMixer);

        this.playerInRange = false;

        this.dashTarget = null;
        this.dashing = false;

        this.stunned = false;

        this.stunParticle = null;
    }

    Update()
    {
        // The enemy cannot do anything until the stun timer has run out
        if (this.stunned) 
        {
            if (this.stunParticle == null || this.stunParticle._destroyed)
            {
                this.stunParticle = new EnemyStunParticle(this.gameObject.scene);

                this.stunParticle.transform.parent = this.gameObject.transform;
                this.stunParticle.transform.localPosition = Vector2.zero;
            }

            return; 
        }

        // If the enemy hasn't locked onto a target: move towards the player and lock onto them once in range

        if (this.dashTarget == null)
        {
            if (this.dashTimer.particle != null) { this.dashTimer.particle.Base_Destroy(); this.dashTimer.particle = null; }

            let _distanceToPlayer = Vector2.Distance(this.gameObject.transform.position, this.player.transform.position);

            if (_distanceToPlayer <= this.detectRange && _distanceToPlayer > this.attackRange)
            {
                const _direction = Vector2.Subtract(this.player.transform.position, this.gameObject.transform.position);

                const _move = Vector2.Multiply(_direction.normalised, new Vector2(Engine.I.deltaTime * this.speed, Engine.I.deltaTime * this.speed));

                this.gameObject.transform.localPosition.Add(_move);

                this.playerInRange = true;
            }

            else if (_distanceToPlayer <= this.detectRange)
            {
                this.dashTarget = this.player.transform.position;
                this.dashTimer.Play();

                this.playerInRange = true;
            }

            if (_distanceToPlayer > this.detectRange)
            {
                this.dashTimer.Pause();

                this.playerInRange = false;
            }
        }

        else
        {
            // Dash towards the target until the distance reaches 5 units

            if (this.dashing)
            {
                if (this.dashTimer.particle != null) { this.dashTimer.particle.Base_Destroy(); this.dashTimer.particle = null; }

                let _distanceToTarget = Vector2.Distance(this.dashTarget, this.gameObject.transform.position);

                if (_distanceToTarget > 5)
                {
                    const _direction = Vector2.Subtract(this.dashTarget, this.gameObject.transform.position);

                    const _dash = Vector2.Multiply(_direction.normalised, new Vector2(Engine.I.deltaTime * this.dashSpeed, Engine.I.deltaTime * this.dashSpeed));

                    this.gameObject.transform.localPosition.Add(_dash);
                }

                if (!this.dashTimer._running)
                {
                    this.dashTimer.Play();
                }
            }
        }

        this.UpdateAnimator();
    }

    UpdateAnimator()
    {
        if (this.playerInRange && this.dashTarget == null)
        {
            let _x;
            let _y;

            const _direction = Vector2.Subtract(this.player.transform.position, this.gameObject.transform.position);

            _x = _direction.x;
            _y = _direction.y;

            const _degrees = Math.atan2(_y, _x) * 180 / Math.PI;

            let _frame = 0;

            // Assign animation frame corresponding to the player's angle
        
            if (_degrees >= -22.5 && _degrees < 22.5) { _frame = 2; }

            else if (_degrees >= 22.5 && _degrees < 67.5) { _frame = 1; }

            else if (_degrees >= 67.5 && _degrees < 112.5) { _frame = 0; }

            else if (_degrees >= 112.5 && _degrees < 157.5) { _frame = 7; }

            else if (_degrees >= 157.5 || _degrees < -157.5) { _frame = 6; }

            else if (_degrees >= -157.5 && _degrees < -112.5) { _frame = 5; }

            else if (_degrees >= -112.5 && _degrees < -67.5) { _frame = 4; }

            else if (_degrees >= -67.5 && _degrees < -22.5) { _frame = 3; }

            this.directionDegrees = _degrees;

            this.animator.JumpToFrame(_frame);
        }

        else if (this.dashTarget != null)
        {
            let _x;
            let _y;

            const _direction = Vector2.Subtract(this.dashTarget, this.gameObject.transform.position);

            _x = _direction.x;
            _y = _direction.y;

            const _degrees = Math.atan2(_y, _x) * 180 / Math.PI;

            let _frame = 0;

            // Assign animation frame corresponding to the dash target's angle
        
            if (_degrees >= -22.5 && _degrees < 22.5) { _frame = 2; }

            else if (_degrees >= 22.5 && _degrees < 67.5) { _frame = 1; }

            else if (_degrees >= 67.5 && _degrees < 112.5) { _frame = 0; }

            else if (_degrees >= 112.5 && _degrees < 157.5) { _frame = 7; }

            else if (_degrees >= 157.5 || _degrees < -157.5) { _frame = 6; }

            else if (_degrees >= -157.5 && _degrees < -112.5) { _frame = 5; }

            else if (_degrees >= -112.5 && _degrees < -67.5) { _frame = 4; }

            else if (_degrees >= -67.5 && _degrees < -22.5) { _frame = 3; }

            this.directionDegrees = _degrees;

            this.animator.JumpToFrame(_frame);
        }
    }

    OnDamageTaken()
    {
        this.damageSFX.Stop();
        this.damageSFX.Play();

        this.healthUI.animator.JumpToFrame(this.healthUI.animator.currentFrame + 1);
    }

    OnEntityKilled(_scoreValue=50)
    {
        // Spawn a particle effect upon dying, update the save state, increment the score counter and destroy this enemy instance

        let _particle = new DeathParticle(this.gameObject.scene);
        _particle.transform.position = this.gameObject.transform.position;

        this.gameObject.scene.levelTransferProperties.enemies[this.gameObject.id][1] = false;
        this.gameObject.scene.enemyCounter -= 1;

        Engine.I.persistentScene.transferProperties.score += _scoreValue;

        this.gameObject.deathSFX.Play();

        this.gameObject.Base_Destroy();
    }
}

// GameObject container for the enemy controller carrying utilities such as the animator and collider

export class Enemy extends GameObject
{
    constructor(scene, id, name="Enemy", parent=null)
    {
        super(scene, name, parent);

        this.fixedAnimationClip = new AnimationClip("FixedAnim", 0, 8, 0, false, false);
        
        this.renderer = this.AddComponent(SpriteRenderer, new Sprite(this.scene.enemyTexture, undefined, undefined, new Vector2(32, 32)));
        this.animator = this.AddComponent(Animator, this.renderer, 8, [this.fixedAnimationClip]);
        
        this.col = this.AddComponent(EnemyCollider, new Vector2(32, 32));

        this.id = id;

        this.deathSFX = new GameObject(this.scene, "DeathSFX").AddComponent(AudioPlayer, "source/tireless/resources/audio/Shared/Tireless_DeathSound.wav", Engine.I.sfxMixer);
        
        this.controller = this.AddComponent(EnemyController);
    }
}

// Collider that handles collision between an enemy's bullet and any obstacle it encounters. Also moves the bullet in the direction it was fired in

export class RangedEnemyBulletCollider extends AABB
{
    constructor(gameObject, dimensions, direction)
    {
        super(gameObject, dimensions);

        this.ignoreTypes = [BossEnemyCollider, RangedEnemyCollider, WaterCollider, InteractableCollider];

        this.speed = 250;
        this.direction = direction;
    }

    // Move the bullet towards the target specified by the direction

    Update()
    {
        const _move = Vector2.Multiply(this.direction.normalised, new Vector2(Engine.I.deltaTime * this.speed, Engine.I.deltaTime * this.speed));

        this.gameObject.transform.localPosition.Add(_move);

        this.gameObject.scene.colliderManager.Compare(this);
    }

    // If a valid target is hit, inflict damage and spawn a blood particle. Otherwise, play an impact sound. Both cases lead to bullet destruction

    OnCollisionDetected(_other)
    {
        if (_other instanceof PlayerCollider || _other instanceof EnemyCollider)
        {
            _other.gameObject.controller.Damage(25);

            let _bloodParticle = new BloodParticle(this.gameObject.scene);
            _bloodParticle.transform.position = this.gameObject.transform.position;
        }

        else
        {
            this.gameObject.impactSFX.Stop();
            this.gameObject.impactSFX.Play();
        }

        this.gameObject.Base_Destroy();
    }
}

export class RangedEnemyBullet extends GameObject
{
    constructor(scene, direction, name="Bullet", parent=null)
    {
        super(scene, name, parent);
        
        let _texture = new Image();
        _texture.src = "source/tireless/resources/textures/Shared/tirelessBullet.png";

        this.renderer = this.AddComponent(SpriteRenderer, new Sprite(_texture, undefined, undefined, new Vector2(16, 16)));

        this.impactSFX = new GameObject(this.scene, "BulletImpactSFX").AddComponent(AudioPlayer, "source/tireless/resources/audio/Shared/Tireless_BulletImpactObstacle.wav", Engine.I.sfxMixer);
        
        this.col = this.AddComponent(RangedEnemyBulletCollider, new Vector2(16, 16), direction);

        this.transform.scale = new Vector2(0.25, 0.25);
    }
}

// Collider that simply prevents the ranged enemy from walking through obstacles

export class RangedEnemyCollider extends EnemyCollider
{
    constructor(gameObject, dimensions)
    {
        super(gameObject, dimensions);

        this.ignoreTypes = [RangedEnemyBulletCollider, PlayerOnlyCollider, InteractableCollider];
    }

    OnCollisionDetected(_other)
    {
        const _delta = new Vector2(
            _other.gameObject.transform.position.x - this.gameObject.transform.position.x,
            _other.gameObject.transform.position.y - this.gameObject.transform.position.y
        )

        const _penDepth = new Vector2(
            (this.dimensions.x / 2 + _other.dimensions.x / 2) - Math.abs(_delta.x), 
            (this.dimensions.y / 2 + _other.dimensions.y / 2) - Math.abs(_delta.y)
        );

        if (_penDepth.x < _penDepth.y)
        {
            this.gameObject.transform.localPosition.x -= (_penDepth.x + this.epsilon) * Math.sign(_delta.x);
        }

        else
        {
            this.gameObject.transform.localPosition.y -= (_penDepth.y + this.epsilon) * Math.sign(_delta.y);
        }
    }
}

// Simple timer that dictates when the ranged enemy is ready to shoot. Plays a sound effect to alert the player before a shot is fired

export class RangedEnemyShootTimer extends Timer
{
    constructor(gameObject, startValue=2, autoPlay=false, destructive=false)
    {
        super(gameObject, startValue, autoPlay, destructive);
    }

    OnTimerPlay()
    {
        if (this.enemy == undefined)
        {
            this.enemy = this.gameObject.GetComponent(RangedEnemyController);
        }

        this.enemy.shotReadySFX.Stop();
        this.enemy.shotReadySFX.Play();
    }

    OnTimerUp()
    {
        if (this.enemy == undefined)
        {
            this.enemy = this.gameObject.GetComponent(RangedEnemyController);
        }

        this.enemy.Shoot();
    }
}

// Complex class inheriting the standard EnemyController that maintains a distance from the player and shoots at them. Bullets can be parried 

export class RangedEnemyController extends EnemyController
{
    constructor(gameObject)
    {
        super(gameObject);

        this.player = this.gameObject.scene.player;

        this.speed = 60;

        this.evadeRange = 64;
        this.attackRange = 196;

        this.shootTimer = this.gameObject.AddComponent(RangedEnemyShootTimer);

        this.muzzleFlashPosition = this.gameObject.transform.position;

        this.animator = this.gameObject.GetComponent(Animator);
        this.col = this.gameObject.GetComponent(RangedEnemyCollider);

        this.healthUI = new EnemyHealthUI(this.gameObject.scene, "EnemyHealthUI", this.gameObject.transform);
        this.healthUI.transform.localPosition = new Vector2(0, 28);

        this.damageSFX = this.gameObject.AddComponent(AudioPlayer, "source/tireless/resources/audio/Shared/Tireless_EnemyDamaged.wav", Engine.I.sfxMixer);
        this.shootSFX = this.gameObject.AddComponent(AudioPlayer, "source/tireless/resources/audio/Shared/Tireless_Gunshot.wav", Engine.I.sfxMixer);

        this.shotReadySFX = this.gameObject.AddComponent(AudioPlayer, "source/tireless/resources/audio/Shared/Tireless_ShotReady.wav", Engine.I.sfxMixer);
    }

    // If a valid target is detected by the raycast, a bullet will be spawned and sent in its direction

    Shoot()
    {
        const _direction = Vector2.Subtract(this.player.transform.position, this.gameObject.transform.position);

        const _hit = this.gameObject.scene.colliderManager.Raycast(this.gameObject.transform.position, _direction, this.attackRange, 1, undefined, [PlayerCollider]);

        if (_hit[1] != undefined)
        {
            this.shootSFX.Stop();
            this.shootSFX.Play();

            let _particle = new RangedEnemyMuzzleFlashParticle(this.gameObject.scene);
            _particle.transform.position = this.muzzleFlashPosition;

            const _degrees = Math.atan2(_direction.y, _direction.x) * 180 / Math.PI;

            let _bullet = new RangedEnemyBullet(this.gameObject.scene, _direction);
            _bullet.transform.position = this.muzzleFlashPosition;
            _bullet.transform.rotation = _degrees - 90;
        }
    }

    Update()
    {
        let _distanceToPlayer = Vector2.Distance(this.gameObject.transform.position, this.player.transform.position);

        // If the player is too close, the enemy will back away from them slowly

        if (_distanceToPlayer <= this.evadeRange)
        {
            const _direction = Vector2.Subtract(this.player.transform.position, this.gameObject.transform.position);

            const _move = Vector2.Multiply(_direction.normalised, new Vector2(Engine.I.deltaTime * this.speed, Engine.I.deltaTime * this.speed));

            this.gameObject.transform.localPosition.Subtract(_move);
        }

        // If the player is outside of the attack range, the enemy will slowly move towards them
        
        else if (_distanceToPlayer > this.attackRange)
        {
            const _direction = Vector2.Subtract(this.player.transform.position, this.gameObject.transform.position);

            const _move = Vector2.Multiply(_direction.normalised, new Vector2(Engine.I.deltaTime * this.speed, Engine.I.deltaTime * this.speed));

            this.gameObject.transform.localPosition.Add(_move);

            this.shootTimer.Stop();
        }

        // Otherwise, the enemy is ready to shoot and will try to fire at the player

        else
        {
            if (!this.shootTimer._running)
            {
                this.shootTimer.Play();
            }
        }

        this.UpdateAnimator();
    }

    UpdateAnimator()
    {
        let _x;
        let _y;

        const _direction = Vector2.Subtract(this.player.transform.position, this.gameObject.transform.position);

        _x = _direction.x;
        _y = _direction.y;

        const _degrees = Math.atan2(_y, _x) * 180 / Math.PI;

        let _frame = 0;
    
        if (_degrees >= -22.5 && _degrees < 22.5) { _frame = 2; this.muzzleFlashPosition = Vector2.Add(this.gameObject.transform.position, new Vector2(14, 0)); }

        else if (_degrees >= 22.5 && _degrees < 67.5) { _frame = 1; this.muzzleFlashPosition = Vector2.Add(this.gameObject.transform.position, new Vector2(8, 8)); }

        else if (_degrees >= 67.5 && _degrees < 112.5) { _frame = 0; this.muzzleFlashPosition = Vector2.Add(this.gameObject.transform.position, new Vector2(0, 8)); }

        else if (_degrees >= 112.5 && _degrees < 157.5) { _frame = 7; this.muzzleFlashPosition = Vector2.Add(this.gameObject.transform.position, new Vector2(-8, 8)); }

        else if (_degrees >= 157.5 || _degrees < -157.5) { _frame = 6; this.muzzleFlashPosition = Vector2.Add(this.gameObject.transform.position, new Vector2(-14, 0)); }

        else if (_degrees >= -157.5 && _degrees < -112.5) { _frame = 5; this.muzzleFlashPosition = Vector2.Add(this.gameObject.transform.position, new Vector2(-8, -3)); }

        else if (_degrees >= -112.5 && _degrees < -67.5) { _frame = 4; this.muzzleFlashPosition = Vector2.Add(this.gameObject.transform.position, new Vector2(-3, -1)); }

        else if (_degrees >= -67.5 && _degrees < -22.5) { _frame = 3; this.muzzleFlashPosition = Vector2.Add(this.gameObject.transform.position, new Vector2(8, -2)); }

        this.directionDegrees = _degrees;

        this.animator.JumpToFrame(_frame);
    }

    // Ranged enemies have a higher score value due to their increased difficulty

    OnEntityKilled(_scoreValue=150)
    {
        super.OnEntityKilled(_scoreValue);
    }
}

// GameObject container for the RangedEnemyController that stores its id, collider, animator and other such utilities

export class RangedEnemy extends GameObject
{
    constructor(scene, id, name="RangedEnemy", parent=null)
    {
        super(scene, name, parent);

        this.fixedAnimationClip = new AnimationClip("FixedAnim", 0, 8, 0, false, false);
        
        this.renderer = this.AddComponent(SpriteRenderer, new Sprite(this.scene.rangedEnemyTexture, undefined, undefined, new Vector2(32, 32)));
        this.animator = this.AddComponent(Animator, this.renderer, 8, [this.fixedAnimationClip]);
        
        this.col = this.AddComponent(RangedEnemyCollider, new Vector2(32, 32));
        
        this.id = id;

        this.deathSFX = new GameObject(this.scene, "DeathSFX").AddComponent(AudioPlayer, "source/tireless/resources/audio/Shared/Tireless_DeathSound.wav", Engine.I.sfxMixer);

        this.controller = this.AddComponent(RangedEnemyController);
    }
}

// Identical to the EnemyCollider, except it is not vulnerable to enemy bullets and deals more damage from dash attacks

export class BossEnemyCollider extends EnemyCollider
{
    constructor(gameObject, dimensions)
    {
        super(gameObject, dimensions);

        this.ignoreTypes = [RangedEnemyBulletCollider, PlayerOnlyCollider, InteractableCollider];
    }

    OnCollisionDetected(_other)
    {
        const _delta = new Vector2(
            _other.gameObject.transform.position.x - this.gameObject.transform.position.x,
            _other.gameObject.transform.position.y - this.gameObject.transform.position.y
        )

        const _penDepth = new Vector2(
            (this.dimensions.x / 2 + _other.dimensions.x / 2) - Math.abs(_delta.x), 
            (this.dimensions.y / 2 + _other.dimensions.y / 2) - Math.abs(_delta.y)
        );

        if (_penDepth.x < _penDepth.y)
        {
            this.gameObject.transform.localPosition.x -= (_penDepth.x + this.epsilon) * Math.sign(_delta.x);
        }

        else
        {
            this.gameObject.transform.localPosition.y -= (_penDepth.y + this.epsilon) * Math.sign(_delta.y);
        }

        if (_other instanceof PlayerCollider)
        {
            if (this.enemy == undefined)
            {
                this.enemy = this.gameObject.GetComponent(BossEnemyController);
            }

            if (!this.enemy.stunned && this.enemy.dashing)
            {
                this.enemy.player.controller.Damage(50);
            }

            this.enemy.dashing = false;
            this.enemy.dashTarget = null;
        }
    }
}

// Simple timer that makes the BossEnemyController dash at the player in rapid succession

export class BossEnemyDashTimer extends Timer
{
    constructor(gameObject, startValue=0.65, autoPlay=false, destructive=false)
    {
        super(gameObject, startValue, autoPlay, destructive);
    }

    OnTimerPlay()
    {
        if (this.particle != null) { this.particle.Base_Destroy(); }

        this.particle = new DashParticle(this.gameObject.scene, this.gameObject.transform);
        this.particle.transform.localPosition = Vector2.zero;
    }

    OnTimerUp()
    {
        if (this.enemy == undefined)
        {
            this.enemy = this.gameObject.GetComponent(BossEnemyController);
        }

        if (!this.enemy.dashing) { this.enemy.dashing = true; this.enemy.dashSFX.Stop(); this.enemy.dashSFX.Play(); }

        else
        {
            this.enemy.dashing = false;
            this.enemy.dashTarget = null;
        }
    }
}

// Simple timer that stuns the BossEnemyController

export class BossEnemyStunTimer extends Timer
{
    constructor(gameObject, startValue=3, autoPlay=false, destructive=false)
    {
        super(gameObject, startValue, autoPlay, destructive);
    }

    OnTimerUp()
    {
        if (this.enemy == undefined)
        {
            this.enemy = this.gameObject.GetComponent(BossEnemyController);
        }

        this.enemy.stunned = false;

        this.enemy.dashTimer.Stop();
    }
}

// Simple timer that triggers the BossEnemyController's ranged phase attack

export class BossEnemyShootTimer extends Timer
{
    constructor(gameObject, startValue=0.65, autoPlay=false, destructive=false)
    {
        super(gameObject, startValue, autoPlay, destructive);
    }

    OnTimerPlay()
    {
        if (this.enemy == undefined)
        {
            this.enemy = this.gameObject.GetComponent(BossEnemyController);
        }

        this.enemy.shotReadySFX.Stop();
        this.enemy.shotReadySFX.Play();
    }

    OnTimerUp()
    {
        if (this.enemy == undefined)
        {
            this.enemy = this.gameObject.GetComponent(BossEnemyController);
        }

        this.enemy.Shoot();
    }
}

// Simple timer that makes the BossEnemyController change to a new phase over time

export class BossEnemySwitchModeTimer extends Timer 
{
    constructor(gameObject, startValue=10, autoPlay=false, destructive=false)
    {
        super(gameObject, startValue, autoPlay, destructive);
    }

    OnTimerUp()
    {
        if (this.enemy == undefined)
        {
            this.enemy = this.gameObject.GetComponent(BossEnemyController);
        }

        this.enemy.rangedMode = !this.enemy.rangedMode;
    }
}

// Advanced enemy type that can switch between melee and ranged modes

export class BossEnemyController extends EnemyController
{
    constructor(gameObject)
    {
        super(gameObject);

        this.speed = 200;
        this.dashSpeed = 350;

        this.detectRange = 512;
        this.dashAttackRange = 80;

        this.rangedEvadeRange = 96;
        this.rangedAttackRange = 256;

        this.healthUI.Base_Destroy();

        this.healthUI = new BossEnemyHealthUI(this.gameObject.scene, "BossEnemyHealthUI", this.gameObject.transform);
        this.healthUI.transform.localPosition = new Vector2(0, 28);

        this.dashTimer = this.gameObject.AddComponent(BossEnemyDashTimer);
        this.stunTimer = this.gameObject.AddComponent(BossEnemyStunTimer);

        this.shootTimer = this.gameObject.AddComponent(BossEnemyShootTimer);

        this.switchTimer = this.gameObject.AddComponent(BossEnemySwitchModeTimer);

        this.shotReadySFX = this.gameObject.AddComponent(AudioPlayer, "source/tireless/resources/audio/Shared/Tireless_ShotReady.wav", Engine.I.sfxMixer);
        this.shootSFX = this.gameObject.AddComponent(AudioPlayer, "source/tireless/resources/audio/Shared/Tireless_Gunshot.wav", Engine.I.sfxMixer);

        this.muzzleFlashPosition = this.gameObject.transform.position;

        this.rangedMode = false;
    }

    Update()
    {
        if (this.stunned) 
        {
            if (this.stunParticle == null || this.stunParticle._destroyed)
            {
                this.stunParticle = new EnemyStunParticle(this.gameObject.scene);

                this.stunParticle.transform.parent = this.gameObject.transform;
                this.stunParticle.transform.localPosition = Vector2.zero;
            }

            return; 
        }

        if (!this.rangedMode)
        {
            this.DashMode();
        }

        else
        {
            // Ensure dash particles despawn when switching to ranged mode

            if (this.dashTimer.particle != null)
            {
                this.dashTimer.particle.Base_Destroy();

                this.dashTimer.particle = null;
            }

            this.RangedMode();
        }

        if (!this.switchTimer._running)
        {
            this.switchTimer.Stop();
            this.switchTimer.Play();
        }

        this.UpdateAnimator();
    }

    DashMode()
    {
        if (this.dashTarget == null)
        {
            if (this.dashTimer.particle != null) { this.dashTimer.particle.Base_Destroy(); this.dashTimer.particle = null; }

            let _distanceToPlayer = Vector2.Distance(this.gameObject.transform.position, this.player.transform.position);

            if (_distanceToPlayer <= this.detectRange && _distanceToPlayer > this.attackRange)
            {
                const _direction = Vector2.Subtract(this.player.transform.position, this.gameObject.transform.position);

                const _move = Vector2.Multiply(_direction.normalised, new Vector2(Engine.I.deltaTime * this.speed, Engine.I.deltaTime * this.speed));

                this.gameObject.transform.localPosition.Add(_move);

                this.playerInRange = true;
            }

            else if (_distanceToPlayer <= this.detectRange)
            {
                this.dashTarget = this.player.transform.position;
                this.dashTimer.Play();

                this.playerInRange = true;
            }

            if (_distanceToPlayer > this.detectRange)
            {
                this.dashTimer.Pause();

                this.playerInRange = false;
            }
        }

        else
        {
            if (this.dashing)
            {
                if (this.dashTimer.particle != null) { this.dashTimer.particle.Base_Destroy(); this.dashTimer.particle = null; }

                let _distanceToTarget = Vector2.Distance(this.dashTarget, this.gameObject.transform.position);

                if (_distanceToTarget > 5)
                {
                    const _direction = Vector2.Subtract(this.dashTarget, this.gameObject.transform.position);

                    const _dash = Vector2.Multiply(_direction.normalised, new Vector2(Engine.I.deltaTime * this.dashSpeed, Engine.I.deltaTime * this.dashSpeed));

                    this.gameObject.transform.localPosition.Add(_dash);
                }

                if (!this.dashTimer._running)
                {
                    this.dashTimer.Play();
                }
            }
        }
    }

    RangedMode()
    {
        let _distanceToPlayer = Vector2.Distance(this.gameObject.transform.position, this.player.transform.position);

        if (_distanceToPlayer <= this.rangedEvadeRange)
        {
            const _direction = Vector2.Subtract(this.player.transform.position, this.gameObject.transform.position);

            const _move = Vector2.Multiply(_direction.normalised, new Vector2(Engine.I.deltaTime * this.speed, Engine.I.deltaTime * this.speed));

            this.gameObject.transform.localPosition.Subtract(_move);
        }
        
        else if (_distanceToPlayer > this.rangedAttackRange)
        {
            const _direction = Vector2.Subtract(this.player.transform.position, this.gameObject.transform.position);

            const _move = Vector2.Multiply(_direction.normalised, new Vector2(Engine.I.deltaTime * this.speed, Engine.I.deltaTime * this.speed));

            this.gameObject.transform.localPosition.Add(_move);

            this.shootTimer.Stop();
        }

        else
        {
            if (!this.shootTimer._running)
            {
                this.shootTimer.Play();
            }
        }
    }

    Shoot()
    {
        const _direction = Vector2.Subtract(this.player.transform.position, this.gameObject.transform.position);

        const _hit = this.gameObject.scene.colliderManager.Raycast(this.gameObject.transform.position, _direction, this.rangedAttackRange, 1, undefined, [PlayerCollider]);

        if (_hit[1] != undefined)
        {
            this.shootSFX.Stop();
            this.shootSFX.Play();

            let _particle = new RangedEnemyMuzzleFlashParticle(this.gameObject.scene);
            _particle.transform.position = this.muzzleFlashPosition;

            const _degrees = Math.atan2(_direction.y, _direction.x) * 180 / Math.PI;

            let _bullet = new RangedEnemyBullet(this.gameObject.scene, _direction);
            _bullet.transform.position = this.muzzleFlashPosition;
            _bullet.transform.rotation = _degrees - 90;
        }
    }

    UpdateAnimator()
    {
        let _x;
        let _y;

        const _direction = Vector2.Subtract(this.player.transform.position, this.gameObject.transform.position);

        _x = _direction.x;
        _y = _direction.y;

        const _degrees = Math.atan2(_y, _x) * 180 / Math.PI;

        let _frame = 0;
    
        if (_degrees >= -22.5 && _degrees < 22.5) { _frame = 2; this.muzzleFlashPosition = Vector2.Add(this.gameObject.transform.position, new Vector2(14, 0)); }

        else if (_degrees >= 22.5 && _degrees < 67.5) { _frame = 1; this.muzzleFlashPosition = Vector2.Add(this.gameObject.transform.position, new Vector2(8, 8)); }

        else if (_degrees >= 67.5 && _degrees < 112.5) { _frame = 0; this.muzzleFlashPosition = Vector2.Add(this.gameObject.transform.position, new Vector2(0, 8)); }

        else if (_degrees >= 112.5 && _degrees < 157.5) { _frame = 7; this.muzzleFlashPosition = Vector2.Add(this.gameObject.transform.position, new Vector2(-8, 8)); }

        else if (_degrees >= 157.5 || _degrees < -157.5) { _frame = 6; this.muzzleFlashPosition = Vector2.Add(this.gameObject.transform.position, new Vector2(-14, 0)); }

        else if (_degrees >= -157.5 && _degrees < -112.5) { _frame = 5; this.muzzleFlashPosition = Vector2.Add(this.gameObject.transform.position, new Vector2(-8, -3)); }

        else if (_degrees >= -112.5 && _degrees < -67.5) { _frame = 4; this.muzzleFlashPosition = Vector2.Add(this.gameObject.transform.position, new Vector2(-3, -1)); }

        else if (_degrees >= -67.5 && _degrees < -22.5) { _frame = 3; this.muzzleFlashPosition = Vector2.Add(this.gameObject.transform.position, new Vector2(8, -2)); }

        this.directionDegrees = _degrees;

        this.animator.JumpToFrame(_frame);
    }

    OnEntityKilled(_scoreValue=1000)
    {
        super.OnEntityKilled(_scoreValue);
    }
}

// GameObject container for the BossEnemy

export class BossEnemy extends GameObject
{
    constructor(scene, id, name="BossEnemy", parent=null)
    {
        super(scene, name, parent);

        this.fixedAnimationClip = new AnimationClip("FixedAnim", 0, 8, 0, false, false);

        this.renderer = this.AddComponent(SpriteRenderer, new Sprite(this.scene.bossEnemyTexture, undefined, undefined, new Vector2(32, 32)));
        this.animator = this.AddComponent(Animator, this.renderer, 8, [this.fixedAnimationClip]);
        
        this.col = this.AddComponent(BossEnemyCollider, new Vector2(32, 32));
        
        this.id = id;

        this.deathSFX = new GameObject(this.scene, "DeathSFX").AddComponent(AudioPlayer, "source/tireless/resources/audio/Shared/Tireless_DeathSound.wav", Engine.I.sfxMixer);

        this.controller = this.AddComponent(BossEnemyController);
    }
}