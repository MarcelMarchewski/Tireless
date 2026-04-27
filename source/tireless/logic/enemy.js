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
    EnemyStunParticle,
    RangedEnemyMuzzleFlashParticle
} from "/source/tireless/logic/particles.js";

import
{
    EnemyHealthUI
} from "/source/tireless/logic/UI.js";

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

export class EnemyDashTimer extends Timer
{
    constructor(gameObject, startValue=1, autoPlay=false, destructive=false)
    {
        super(gameObject, startValue, autoPlay, destructive);
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

        this.moving = true;

        this.playerInRange = false;

        this.dashTarget = null;
        this.dashing = false;

        this.stunned = false;

        this.stunParticle = null;
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

        if (this.dashTarget == null)
        {
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

    OnEntityKilled()
    {
        let _particle = new DeathParticle(this.gameObject.scene);
        _particle.transform.position = this.gameObject.transform.position;

        this.gameObject.scene.enemyCounter -= 1;

        this.gameObject.Base_Destroy();
    }
}

export class Enemy extends GameObject
{
    constructor(scene, name="Enemy", parent=null)
    {
        super(scene, name, parent);

        this.fixedAnimationClip = new AnimationClip("FixedAnim", 0, 8, 0, false, false);
        
        this.renderer = this.AddComponent(SpriteRenderer, new Sprite(this.scene.enemyTexture, undefined, undefined, new Vector2(32, 32)));
        this.animator = this.AddComponent(Animator, this.renderer, 8, [this.fixedAnimationClip]);
        
        this.col = this.AddComponent(EnemyCollider, new Vector2(32, 32));
        
        this.controller = this.AddComponent(EnemyController);
    }
}

export class RangedEnemyBulletCollider extends AABB
{
    constructor(gameObject, dimensions, direction)
    {
        super(gameObject, dimensions);

        this.ignoreTypes = [RangedEnemyCollider, WaterCollider];

        this.speed = 250;
        this.direction = direction;
    }

    Update()
    {
        const _move = Vector2.Multiply(this.direction.normalised, new Vector2(Engine.I.deltaTime * this.speed, Engine.I.deltaTime * this.speed));

        this.gameObject.transform.localPosition.Add(_move);

        this.gameObject.scene.colliderManager.Compare(this);
    }

    OnCollisionDetected(_other)
    {
        if (_other instanceof PlayerCollider || _other instanceof EnemyCollider)
        {
            _other.gameObject.controller.Damage(25);
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
        
        this.col = this.AddComponent(RangedEnemyBulletCollider, new Vector2(16, 16), direction);

        this.transform.scale = new Vector2(0.25, 0.25);
    }
}

export class RangedEnemyCollider extends EnemyCollider
{
    constructor(gameObject, dimensions)
    {
        super(gameObject, dimensions);

        this.ignoreTypes = [RangedEnemyBulletCollider];
    }

    Update()
    {
        this.gameObject.scene.colliderManager.Compare(this);
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

export class RangedEnemyShootTimer extends Timer
{
    constructor(gameObject, startValue=2, autoPlay=false, destructive=false)
    {
        super(gameObject, startValue, autoPlay, destructive);
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

        this.moving = true;
    }

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
            _bullet.transform.position = this.gameObject.transform.position;
            _bullet.transform.rotation = _degrees - 90;
        }
    }

    Update()
    {
        let _distanceToPlayer = Vector2.Distance(this.gameObject.transform.position, this.player.transform.position);

        if (_distanceToPlayer <= this.evadeRange)
        {
            const _direction = Vector2.Subtract(this.player.transform.position, this.gameObject.transform.position);

            const _move = Vector2.Multiply(_direction.normalised, new Vector2(Engine.I.deltaTime * this.speed, Engine.I.deltaTime * this.speed));

            this.gameObject.transform.localPosition.Subtract(_move);
        }
        
        if (_distanceToPlayer > this.attackRange)
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

        else if (_degrees >= 67.5 && _degrees < 112.5) { _frame = 0; this.muzzleFlashPosition = Vector2.Add(this.gameObject.transform.position, new Vector2(-5000, -5000)); }

        else if (_degrees >= 112.5 && _degrees < 157.5) { _frame = 7; this.muzzleFlashPosition = Vector2.Add(this.gameObject.transform.position, new Vector2(-8, 8)); }

        else if (_degrees >= 157.5 || _degrees < -157.5) { _frame = 6; this.muzzleFlashPosition = Vector2.Add(this.gameObject.transform.position, new Vector2(-14, 0)); }

        else if (_degrees >= -157.5 && _degrees < -112.5) { _frame = 5; this.muzzleFlashPosition = Vector2.Add(this.gameObject.transform.position, new Vector2(-8, -3)); }

        else if (_degrees >= -112.5 && _degrees < -67.5) { _frame = 4; this.muzzleFlashPosition = Vector2.Add(this.gameObject.transform.position, new Vector2(-3, -1)); }

        else if (_degrees >= -67.5 && _degrees < -22.5) { _frame = 3; this.muzzleFlashPosition = Vector2.Add(this.gameObject.transform.position, new Vector2(8, -2)); }

        this.directionDegrees = _degrees;

        this.animator.JumpToFrame(_frame);
    }

    OnDamageTaken()
    {
        this.damageSFX.Stop();
        this.damageSFX.Play();

        this.healthUI.animator.JumpToFrame(this.healthUI.animator.currentFrame + 1);
    }

    OnEntityKilled()
    {
        let _particle = new DeathParticle(this.gameObject.scene);
        _particle.transform.position = this.gameObject.transform.position;

        this.gameObject.scene.enemyCounter -= 1;

        this.gameObject.Base_Destroy();
    }
}

export class RangedEnemy extends GameObject
{
    constructor(scene, name="Enemy", parent=null)
    {
        super(scene, name, parent);

        this.fixedAnimationClip = new AnimationClip("FixedAnim", 0, 8, 0, false, false);
        
        this.renderer = this.AddComponent(SpriteRenderer, new Sprite(this.scene.rangedEnemyTexture, undefined, undefined, new Vector2(32, 32)));
        this.animator = this.AddComponent(Animator, this.renderer, 8, [this.fixedAnimationClip]);
        
        this.col = this.AddComponent(RangedEnemyCollider, new Vector2(32, 32));
        
        this.controller = this.AddComponent(RangedEnemyController);
    }
}