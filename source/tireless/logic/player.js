import 
{
    Component,
    GameObject,
    SpriteRenderer,
    Sprite,
    Animator,
    AnimationClip,
    AudioPlayer,
    UICanvas,
    Timer,
    AABB,
    Vector2,
    Engine
} from "/source/engine/rebound.js";

import 
{
    LivingEntity
} from "/source/tireless/logic/livingEntity.js";

import
{
    EnemyCollider,
    EnemyController,
    RangedEnemyBullet,
    RangedEnemyBulletCollider,
    BossEnemyController,
    BossEnemyCollider
} from "/source/tireless/logic/enemy.js";

import 
{
    Particle,
    SwordAttackParticle,
    SwordParryParticle,
    BlockParticle,
    BloodParticle,
    DeathParticle,
    HealParticle,
    RangedEnemyMuzzleFlashParticle,
    DashParticle
} from "/source/tireless/logic/particles.js";

import
{
    WorldCollider,
    WaterCollider
} from "/source/tireless/tireless.js";

import
{
    InteractableCollider
} from "/source/tireless/logic/interactables.js";

import
{
    DeathScreenRetryButton,
    DeathScreenMenuButton,
    WinScreenRestartButton,
    WinScreenMenuButton
} from "/source/tireless/logic/UI.js";

// Renders the death animation and subsequent UICanvas

export class PlayerDeathScreen extends GameObject
{
    constructor(scene, name="PlayerDeathScreen", parent=null)
    {
        super(scene, name, parent);
        
        this.OnAnimationComplete = this.OnAnimationComplete.bind(this);

        this.canvas = new GameObject(this.scene, "Canvas", this.transform).AddComponent(UICanvas);

        this.texture = new Image();
        this.texture.src = "source/tireless/resources/textures/Shared/tirelessDeathScreen.png";

        this.deathScreenAnim = new AnimationClip("DeathScreenAnim", 0, 26, 0.1, false, true, this.OnAnimationComplete);

        this.renderer = this.AddComponent(SpriteRenderer, new Sprite(this.texture, 400, undefined, new Vector2(64, 64)));

        this.animator = this.AddComponent(Animator, this.renderer, 27, [this.deathScreenAnim]);

        this.retryButton = new DeathScreenRetryButton(this.scene, this.canvas.gameObject, new Vector2(64, 32), undefined, undefined, this.canvas.gameObject.transform);
        this.retryButton.enabled = false;

        this.menuButton = new DeathScreenMenuButton(this.scene, this.canvas.gameObject, new Vector2(192, 32), undefined, undefined, this.canvas.gameObject.transform);
        this.menuButton.enabled = false;

        this.transform.position = new Vector2(128, 128);
        this.transform.scale = new Vector2(4, 4);

        this.canvas.gameObject.transform.position = Vector2.zero;
        this.canvas.gameObject.transform.scale = Vector2.one;
    }

    OnAnimationComplete()
    {
        this.retryButton.enabled = true;
        this.menuButton.enabled = true;
    }
}

// Renders the player win animation and subsequent UICanvas

export class PlayerWinScreen extends GameObject
{
    constructor(scene, name="PlayerWinScreen", parent=null)
    {
        super(scene, name, parent);
        
        this.OnAnimationComplete = this.OnAnimationComplete.bind(this);

        this.canvas = new GameObject(this.scene, "Canvas", this.transform).AddComponent(UICanvas);

        this.texture = new Image();
        this.texture.src = "source/tireless/resources/textures/Shared/tirelessWinScreen.png";

        this.winScreenAnim = new AnimationClip("WinScreenAnim", 0, 7, 0.1, false, true, this.OnAnimationComplete);

        this.renderer = this.AddComponent(SpriteRenderer, new Sprite(this.texture, 400, undefined, new Vector2(64, 64)));

        this.animator = this.AddComponent(Animator, this.renderer, 8, [this.winScreenAnim]);

        this.restartButton = new WinScreenRestartButton(this.scene, this.canvas.gameObject, new Vector2(64, 32), undefined, undefined, this.canvas.gameObject.transform);
        this.restartButton.enabled = false;

        this.menuButton = new WinScreenMenuButton(this.scene, this.canvas.gameObject, new Vector2(192, 32), undefined, undefined, this.canvas.gameObject.transform);
        this.menuButton.enabled = false;

        this.transform.position = new Vector2(128, 128);
        this.transform.scale = new Vector2(4, 4);

        this.canvas.gameObject.transform.position = Vector2.zero;
        this.canvas.gameObject.transform.scale = Vector2.one;
    }

    OnAnimationComplete()
    {
        this.restartButton.enabled = true;
        this.menuButton.enabled = true;
    }
}

// Advanced collider handling interactions with the boss enemy. If the boss isn't stunned, the bullet is reflected back at the player. However, a bullet that is parried back into the boss will deal damage even when the boss isn't stunned

export class PlayerBulletCollider extends AABB
{
    constructor(gameObject, dimensions, direction)
    {
        super(gameObject, dimensions);

        this.ignoreTypes = [PlayerCollider, WaterCollider, InteractableCollider];

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
        if (_other instanceof BossEnemyCollider)
        {
            if (this.gameObject.parry == false)
            {
                if (!_other.gameObject.controller.stunned)
                {
                    this.ignoreTypes.push(RangedEnemyBulletCollider);

                    const _newDirection = Vector2.Multiply(this.direction, Vector2.negativeOne);

                    const _degrees = Math.atan2(_newDirection.y, _newDirection.x) * 180 / Math.PI;

                    let _bullet = new RangedEnemyBullet(this.gameObject.scene, _newDirection, true);
                    _bullet.transform.position = this.gameObject.transform.position;
                    _bullet.transform.rotation = _degrees - 90

                    this.gameObject.scene.player.controller.blockParrySFX.SetFile("source/tireless/resources/audio/Shared/Tireless_SwordParry.wav");
                    this.gameObject.scene.player.controller.blockParrySFX.Play()

                    let _particle = new SwordParryParticle(this.gameObject.scene);
                    _particle.transform.position = this.gameObject.transform.position;
                }

                else
                {
                    _other.gameObject.controller.Damage(5);

                    let _bloodParticle = new BloodParticle(this.gameObject.scene);
                    _bloodParticle.transform.position = this.gameObject.transform.position;
                }
            }

            else
            {
                _other.gameObject.controller.Damage(5);

                let _bloodParticle = new BloodParticle(this.gameObject.scene);
                _bloodParticle.transform.position = this.gameObject.transform.position;
            }
        }

        else if (_other instanceof EnemyCollider)
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

export class PlayerBullet extends GameObject
{
    constructor(scene, direction, parry=false, name="PlayerBullet", parent=null)
    {
        super(scene, name, parent);
        
        let _texture = new Image();
        _texture.src = "source/tireless/resources/textures/Shared/tirelessBullet.png";

        this.renderer = this.AddComponent(SpriteRenderer, new Sprite(_texture, undefined, undefined, new Vector2(16, 16)));

        this.impactSFX = new GameObject(this.scene, "BulletImpactSFX").AddComponent(AudioPlayer, "source/tireless/resources/audio/Shared/Tireless_BulletImpactObstacle.wav", Engine.I.sfxMixer);
        
        this.parry = parry;

        this.col = this.AddComponent(PlayerBulletCollider, new Vector2(16, 16), direction);

        this.transform.scale = new Vector2(0.25, 0.25);
    }
}

// Simple collider that ensures the player cannot go through obstacles

export class PlayerCollider extends AABB
{
    constructor(gameObject, dimensions=new Vector2(26, 26))
    {
        super(gameObject, dimensions);

        this.ignoreTypes = [PlayerBulletCollider];

        this.epsilon = 1;
    }

    Update()
    {
        this.gameObject.scene.colliderManager.Compare(this);
    }

    OnCollisionDetected(_other)
    {
        if (_other instanceof InteractableCollider) { return; }

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

// Simple timer that enforces a short parry window for the player

export class PlayerParryTimer extends Timer
{
    constructor(gameObject, startValue=0.05, autoPlay=false, destructive=false)
    {
        super(gameObject, startValue, autoPlay, destructive);
    }

    OnTimerUp()
    {
        if (this.player == undefined)
        {
            this.player = this.gameObject.GetComponent(PlayerController);
        }

        this.player.canParry = false;
    }
}

// Simple timer that enforces a cooldown on melee attacks for the player

export class PlayerAttackTimer extends Timer
{
    constructor(gameObject, startValue=0.5, autoPlay=false, destructive=false)
    {
        super(gameObject, startValue, autoPlay, destructive);
    }

    OnTimerUp()
    {
        if (this.player == undefined)
        {
            this.player = this.gameObject.GetComponent(PlayerController);
        }

        this.player.canAttack = true;
    }
}

// Simple timer that enforces a cooldown on ranged attacks for the player

export class PlayerShootTimer extends Timer
{
    constructor(gameObject, startValue=2, autoPlay=false, destructive=false)
    {
        super(gameObject, startValue, autoPlay, destructive);
    }

    OnTimerUp()
    {
        if (this.player == undefined)
        {
            this.player = this.gameObject.GetComponent(PlayerController);
        }

        this.player.shotReadySFX.Play();
        this.player.canShoot = true;
    }
}

// Complex entity that takes player input and converts it into top-down motion. Features sword attacks, shooting, parrying, blocking and dashing

export class PlayerController extends LivingEntity
{
    constructor(gameObject)
    {
        super(gameObject);

        this.OnMouseDown = this.OnMouseDown.bind(this);
        this.OnMouseUp = this.OnMouseUp.bind(this);

        this.OnKeyDown = this.OnKeyDown.bind(this);
        this.OnKeyUp = this.OnKeyUp.bind(this);
        
        this.OnGamepadButtonDown = this.OnGamepadButtonDown.bind(this);
        this.OnGamepadButtonUp = this.OnGamepadButtonUp.bind(this);

        this.OnGamepadLeftStick = this.OnGamepadLeftStick.bind(this);
        this.OnGamepadRightStick = this.OnGamepadRightStick.bind(this);

        this.animator = this.gameObject.GetComponent(Animator);
        this.col = this.gameObject.GetComponent(PlayerCollider);

        this.speed = 150;
        this.dashSpeed = 400;
        this.deadzone = 0.15;

        this.blockDrainSpeed = 0.03;
        this.blockRefillSpeed = 0.2;

        this.input = Vector2.zero;

        this.rightJoystickInput = Vector2.zero;

        this.directionDegrees = 0;

        this.dashParticle = null;

        this.blockParrySFX = this.gameObject.AddComponent(AudioPlayer, "source/tireless/resources/audio/Shared/Tireless_SwordParry.wav", Engine.I.sfxMixer, 3);
        this.damageSFX = this.gameObject.AddComponent(AudioPlayer, "source/tireless/resources/audio/Shared/Tireless_PlayerDamaged.wav", Engine.I.sfxMixer);

        this.blockStartStopSFX = this.gameObject.AddComponent(AudioPlayer, "source/tireless/resources/audio/Shared/Tireless_BlockStart.wav", Engine.I.sfxMixer, 1.5);

        this.healSFX = this.gameObject.AddComponent(AudioPlayer, "source/tireless/resources/audio/Shared/Tireless_Heal.wav", Engine.I.sfxMixer);
        this.attackSFX = this.gameObject.AddComponent(AudioPlayer, "source/tireless/resources/audio/Shared/Tireless_SwordSwing.wav", Engine.I.sfxMixer);

        this.shotReadySFX = this.gameObject.AddComponent(AudioPlayer, "source/tireless/resources/audio/Shared/Tireless_ShotReady.wav", Engine.I.sfxMixer);
        this.shotSFX = this.gameObject.AddComponent(AudioPlayer, "source/tireless/resources/audio/Shared/Tireless_Gunshot.wav", Engine.I.sfxMixer);

        this.dashSFX = this.gameObject.AddComponent(AudioPlayer, "source/tireless/resources/audio/Shared/Tireless_Dash.wav", Engine.I.sfxMixer);

        this.dashCursor = new DashCursor(this.gameObject.scene, undefined, this.gameObject.transform);
        this.dashCursor.renderer.enabled = false;
        
        this.blockCursor = this.dashCursor.blockCursor;
        this.blockCursor.renderer.enabled = false;

        this.dashing = false;
        this.dashHeld = false;

        this.parryTimer = this.gameObject.AddComponent(PlayerParryTimer);
        this.attackTimer = this.gameObject.AddComponent(PlayerAttackTimer);
        this.shotTimer = this.gameObject.AddComponent(PlayerShootTimer);

        this.muzzleFlashPosition = this.gameObject.transform.position;

        this.blocking = false;

        this.canParry = false;

        this.canAttack = true;
        this.attacking = false;

        this.canShoot = true;
    }

    Start()
    {
        this.BindListeners();
    }

    BindListeners()
    {
        Engine.I.persistentScene.inputManager.AddMouseDownListener(this.OnMouseDown);
        Engine.I.persistentScene.inputManager.AddMouseUpListener(this.OnMouseUp);

        Engine.I.persistentScene.inputManager.AddKeyDownListener(this.OnKeyDown);
        Engine.I.persistentScene.inputManager.AddKeyUpListener(this.OnKeyUp);

        Engine.I.persistentScene.inputManager.AddGamepadButtonDownListener(this.OnGamepadButtonDown);
        Engine.I.persistentScene.inputManager.AddGamepadButtonUpListener(this.OnGamepadButtonUp);

        Engine.I.persistentScene.inputManager.AddGamepadLeftStickListener(this.OnGamepadLeftStick);
        Engine.I.persistentScene.inputManager.AddGamepadRightStickListener(this.OnGamepadRightStick);
    }

    UnbindListeners()
    {
        Engine.I.persistentScene.inputManager.RemoveMouseDownListener(this.OnMouseDown);
        Engine.I.persistentScene.inputManager.RemoveMouseUpListener(this.OnMouseUp);

        Engine.I.persistentScene.inputManager.RemoveKeyDownListener(this.OnKeyDown);
        Engine.I.persistentScene.inputManager.RemoveKeyUpListener(this.OnKeyUp);

        Engine.I.persistentScene.inputManager.RemoveGamepadButtonDownListener(this.OnGamepadButtonDown);
        Engine.I.persistentScene.inputManager.RemoveGamepadButtonUpListener(this.OnGamepadButtonUp);

        Engine.I.persistentScene.inputManager.RemoveGamepadLeftStickListener(this.OnGamepadLeftStick);
        Engine.I.persistentScene.inputManager.RemoveGamepadRightStickListener(this.OnGamepadRightStick);
    }   

    Update()
    {
        if (!this.dashHeld && this.dashParticle != null)
        {
            this.dashParticle.Base_Destroy();

            this.dashParticle = null;
        }

        if (this.blocking)
        {
            let _direction;

            if (Engine.I.persistentScene.inputManager.inputMode == 0)
            {
                const _mousePos = Engine.I.persistentScene.cursorManager.cursorPosition;

                _direction = Vector2.Subtract(_mousePos, this.gameObject.transform.position);
            }

            else
            {
                const _joystickPos = Vector2.Add(this.gameObject.transform.position, this.rightJoystickInput);

                if (this.rightJoystickInput.magnitude < 0.1)
                {
                    _direction = Vector2.zero;
                }

                else
                {
                    _direction = this.rightJoystickInput;
                }
            }

            if (_direction.magnitude > 0)
            {
                const _hit = this.gameObject.scene.colliderManager.Raycast(this.gameObject.transform.position, _direction, 32, 1, undefined, [EnemyCollider, RangedEnemyBulletCollider]);

                if (_hit[1] != undefined)
                {
                    if (_hit[1] instanceof EnemyCollider)
                    {
                        const _enemy = _hit[1].gameObject.GetComponent(EnemyController);

                        if (_enemy.dashing)
                        {
                            if (this.canParry)
                            {
                                _enemy.dashing = false;
                                _enemy.dashTarget = null;

                                _enemy.stunned = true;

                                _enemy.stunTimer.Play();

                                this.blockParrySFX.SetFile("source/tireless/resources/audio/Shared/Tireless_SwordParry.wav");
                                this.blockParrySFX.Play();

                                let _particle = new SwordParryParticle(this.gameObject.scene);
                                _particle.transform.position = _hit[0];
                            }

                            else
                            {
                                _enemy.dashing = false;
                                _enemy.dashTarget = null;

                                this.blockParrySFX.SetFile("source/tireless/resources/audio/Shared/Tireless_SwordClash.wav");
                                this.blockParrySFX.Play();

                                let _particle = new BlockParticle(this.gameObject.scene);
                                _particle.transform.position = _hit[0];
                            }
                        }
                    }

                    else 
                    {
                        if (this.canParry)
                        {
                            // Reflect the bullet at the enemy

                            const _degrees = Math.atan2(_direction.y, _direction.x) * 180 / Math.PI;

                            let _bullet = new PlayerBullet(this.gameObject.scene, _direction, true);
                            _bullet.transform.position = _hit[0];
                            _bullet.transform.rotation = _degrees - 90;

                            this.blockParrySFX.SetFile("source/tireless/resources/audio/Shared/Tireless_SwordParry.wav");
                            this.blockParrySFX.Play();

                            let _particle = new SwordParryParticle(this.gameObject.scene);
                            _particle.transform.position = _hit[0];

                            _hit[1].gameObject.Base_Destroy();
                        }

                        else
                        {
                            this.blockParrySFX.SetFile("source/tireless/resources/audio/Shared/Tireless_SwordClash.wav");
                            this.blockParrySFX.Play();

                            let _particle = new BlockParticle(this.gameObject.scene);
                            _particle.transform.position = _hit[0];

                            _hit[1].gameObject.Base_Destroy();
                        }
                    }
                }
            }
        }

        if (!this.dashing)
        {
            this.gameObject.transform.localPosition.Add(Vector2.Multiply(this.input.normalised, new Vector2(Engine.I.deltaTime * this.speed, Engine.I.deltaTime * this.speed)));

            let _direction;

            if (Engine.I.persistentScene.inputManager.inputMode == 0)
            {
                const _mousePos = Engine.I.persistentScene.cursorManager.cursorPosition;

                this.dashCursor.transform.localRotation = Vector2.DegreeAngle(this.gameObject.transform.position, _mousePos) - 90;
                _direction = Vector2.Subtract(_mousePos, this.gameObject.transform.position);
            }

            else
            {
                const _joystickPos = Vector2.Add(this.gameObject.transform.position, this.rightJoystickInput);

                if (this.rightJoystickInput.magnitude < 0.1)
                {
                    this.dashCursor.transform.localRotation = this.directionDegrees - 90;
                    _direction = Vector2.zero;
                }

                else
                {
                    this.dashCursor.transform.localRotation = Vector2.DegreeAngle(this.gameObject.transform.position, _joystickPos) - 90;
                    _direction = this.rightJoystickInput;
                }
            }

            if (_direction.magnitude > 0)
            {
                const _hit = this.gameObject.scene.colliderManager.Raycast(this.gameObject.transform.position, _direction, 80, 2, [PlayerCollider])[0];

                const _safeHit = Vector2.Subtract(_hit, Vector2.Multiply(_direction.normalised, new Vector2(4, 4)));

                this.dashCursor.pivot.transform.position = _safeHit;
                this.dashCursor.pivot.transform.localPosition.Subtract(new Vector2(0, 10));
            }
        }

        else
        {
            if (this.dashCursor.transform.parent != null)
            {
                this.dashCursor.transform.parent = null;
            }

            const _direction = Vector2.Subtract(this.dashCursor.pivot.transform.position, this.gameObject.transform.position);

            if (_direction.magnitude > 10)
            {
                const _dash = Vector2.Multiply(_direction.normalised, new Vector2(Engine.I.deltaTime * this.dashSpeed, Engine.I.deltaTime * this.dashSpeed));

                this.gameObject.transform.localPosition.Add(_dash);
            }

            else
            {
                this.gameObject.transform.position = this.dashCursor.pivot.transform.position;

                this.dashCursor.transform.parent = this.gameObject.transform;
                this.dashCursor.transform.localPosition = Vector2.zero;

                this.dashing = false;

                this.dashCursor.renderer.enabled = false;

                this.OnDashTargetReached();
            }
        }

        this.UpdateAnimator();
    }

    OnHealthChanged(_amount)
    {
        if (_amount < 0)
        {
            this.damageSFX.Stop();
            this.damageSFX.Play();

            let _bloodParticle = new BloodParticle(this.gameObject.scene);
            _bloodParticle.transform.position = this.gameObject.transform.position;
        }

        else
        {
            this.healSFX.Stop();
            this.healSFX.Play();

            let _healParticle = new HealParticle(this.gameObject.scene);
            _healParticle.transform.parent = this.gameObject.transform;
            _healParticle.transform.localPosition = Vector2.zero;
        }
    }

    OnEntityKilled()
    {
        let _particle = new DeathParticle(this.gameObject.scene);
        _particle.transform.position = this.gameObject.transform.position;

        let _deathScreen = new PlayerDeathScreen(this.gameObject.scene);

        this.gameObject.deathSFX.Play();

        this.UnbindListeners();

        this.gameObject.Base_Destroy();
    }

    OnDashStart()
    {
        this.dashHeld = true;

        if (this.blocking) { return; }

        if (!this.dashing && this.gameObject.scene.dashUI.animator.currentClip.name != "CooldownBarAnim")
        {
            this.dashCursor.animator.JumpToFrame(0);
            this.dashCursor.renderer.enabled = true;

            this.gameObject.scene.dashUI.animator.SetClip("SelectBarAnim");
            this.gameObject.scene.dashUI.animator.Play();

            if (this.dashParticle == null)
            {
                this.dashParticle = new DashParticle(this.gameObject.scene, this.gameObject.transform);
                this.dashParticle.transform.localPosition = Vector2.zero;
            }
        }

        else if(!this.dashing)
        {
            this.dashCursor.animator.JumpToFrame(2);
            this.dashCursor.renderer.enabled = true;
        }
    }

    OnDashStop()
    {
        this.dashHeld = false;

        if (!this.dashing && this.gameObject.scene.dashUI.animator.currentClip.name != "CooldownBarAnim" && !this.blocking)
        {
            this.dashCursor.animator.JumpToFrame(1)
            this.dashing = true;

            this.gameObject.scene.dashUI.animator.SetClip("ActiveBarAnim");

            this.dashSFX.Stop();
            this.dashSFX.Play();

            if (this.dashParticle != null)
            {
                this.dashParticle.Base_Destroy();
                this.dashParticle = null;
            }
        }

        else
        {
            this.dashCursor.transform.parent = this.gameObject.transform;
            this.dashCursor.transform.localPosition = Vector2.zero

            this.dashing = false

            this.dashCursor.renderer.enabled = false;

            if (this.gameObject.scene.dashUI.animator.currentClip.name != "CooldownBarAnim" && !this.blocking)
            {
                this.gameObject.scene.dashUI.animator.SetClip("CooldownBarAnim");
            }
        }
    }

    OnDashTargetReached()
    {
        this.gameObject.scene.dashUI.animator.SetClip("CooldownBarAnim");
    }

    OnBlockStart()
    {
        if (this.dashHeld) { return; }

        if (!this.blocking && this.gameObject.scene.blockUI.animator.currentClip.name != "FillBarAnim")
        {
            this.gameObject.scene.blockUI.animator.Forward();
            this.gameObject.scene.blockUI.animator.Play();

            this.gameObject.scene.blockUI.animator.currentClip.frameDuration = this.blockDrainSpeed;

            this.blocking = true;

            this.blockStartStopSFX.SetFile("source/tireless/resources/audio/Shared/Tireless_BlockStart.wav");
            this.blockStartStopSFX.Play();

            if (!this.parryTimer._running)
            {
                this.parryTimer.Play();

                this.canParry = true;
            }
        }

        else if (!this.blocking)
        {
            this.blockStartStopSFX.SetFile("source/tireless/resources/audio/Shared/Tireless_BlockEnd.wav");
            this.blockStartStopSFX.Play();
        }

        this.blockCursor.renderer.enabled = true;
    }

    OnBlockStop()
    {
        if (this.blocking && this.gameObject.scene.blockUI.animator.currentClip.name != "FillBarAnim")
        {
            this.gameObject.scene.blockUI.animator.Reverse();

            this.gameObject.scene.blockUI.animator.currentClip.frameDuration = this.blockRefillSpeed;

            this.blockStartStopSFX.SetFile("source/tireless/resources/audio/Shared/Tireless_BlockStop.wav");
            this.blockStartStopSFX.Play();

            if (this.parryTimer._running)
            {
                this.parryTimer.Stop();

                this.canParry = false;
            }
        }

        this.blockCursor.renderer.enabled = false;

        this.blocking = false;
    }

    OnAttackStart()
    {
        if (this.blocking || !this.canAttack || this.attacking) { return; }

        let _direction;

        if (Engine.I.persistentScene.inputManager.inputMode == 0)
        {
            const _mousePos = Engine.I.persistentScene.cursorManager.cursorPosition;

            _direction = Vector2.Subtract(_mousePos, this.gameObject.transform.position);
        }

        else
        {
            const _joystickPos = Vector2.Add(this.gameObject.transform.position, this.rightJoystickInput);

            if (this.rightJoystickInput.magnitude < 0.1)
            {
                _direction = Vector2.zero;
            }

            else
            {
                _direction = this.rightJoystickInput;
            }
        }

        if (_direction.magnitude > 0)
        {
            const _hit = this.gameObject.scene.colliderManager.Raycast(this.gameObject.transform.position, _direction, 36, 1, undefined, [WorldCollider, EnemyCollider]);
            
            if (_hit[1] != undefined)
            {
                if (_hit[1] instanceof BossEnemyCollider)
                {
                    const _enemy = _hit[1].gameObject.GetComponent(BossEnemyController);

                    if (!_enemy.stunned)
                    {
                        this.blockParrySFX.SetFile("source/tireless/resources/audio/Shared/Tireless_SwordParry.wav");
                        this.blockParrySFX.Play();

                        let _particle = new SwordParryParticle(this.gameObject.scene);
                        _particle.transform.position = _hit[0];
                    }

                    else
                    {
                        _enemy.Damage(5);

                        let _bloodParticle = new BloodParticle(this.gameObject.scene);
                        _bloodParticle.transform.position = _hit[0];
                    }
                }

                else if (_hit[1] instanceof EnemyCollider)
                { 
                    const _enemy = _hit[1].gameObject.GetComponent(EnemyController);

                    _enemy.Damage(25);

                    let _bloodParticle = new BloodParticle(this.gameObject.scene);
                    _bloodParticle.transform.position = _hit[0];
                }
            }

            this.attackSFX.Stop();
            this.attackSFX.Play();

            let _particle = new SwordAttackParticle(this.gameObject.scene);
            _particle.transform.position = _hit[0];
        }

        this.canAttack = false;
        this.attackTimer.Play();
    }

    OnAttackStop()
    {
        this.attacking = false;
    }

    OnShotStart()
    {
        if (!Engine.I.persistentScene.transferProperties.playerHasGun) { return; }

        if (this.canShoot)
        {
            this.shotSFX.Stop();
            this.shotSFX.Play();

            let _direction;

            if (Engine.I.persistentScene.inputManager.inputMode == 0)
            {
                const _mousePos = Engine.I.persistentScene.cursorManager.cursorPosition;

                _direction = Vector2.Subtract(_mousePos, this.gameObject.transform.position);
            }

            else
            {
                const _joystickPos = Vector2.Add(this.gameObject.transform.position, this.rightJoystickInput);

                if (this.rightJoystickInput.magnitude < 0.1)
                {
                    _direction = Vector2.zero;
                }

                else
                {
                    _direction = this.rightJoystickInput;
                }
            }

            let _particle = new RangedEnemyMuzzleFlashParticle(this.gameObject.scene);
            _particle.transform.position = this.muzzleFlashPosition;

            const _degrees = Math.atan2(_direction.y, _direction.x) * 180 / Math.PI;

            let _bullet = new PlayerBullet(this.gameObject.scene, _direction);
            _bullet.transform.position = this.muzzleFlashPosition;
            _bullet.transform.rotation = _degrees - 90;

            this.canShoot = false;

            this.shotTimer.Play();
        }
    }

    OnMouseDown(_event)
    {
        switch (_event.button)
        {
            case (0):
            {
                this.OnAttackStart();

                break;
            }

            case (2):
            {
                this.OnBlockStart();

                break;
            }
        }
    }

    OnMouseUp(_event)
    {
        switch (_event.button)
        {
            case (0):
            {
                this.OnAttackStop();

                break;
            }

            case (2):
            {
                this.OnBlockStop();

                break;
            }
        }
    }

    OnKeyDown(_event)
    {
        if (_event.repeat) { return; }

        switch (_event.code)
        {
            case ("KeyW"):
            {
                this.input.y += 1;

                break;
            }

            case ("KeyA"):
            {
                this.input.x -= 1;

                break;
            }

            case ("KeyS"):
            {
                this.input.y -= 1;

                break;
            }

            case ("KeyD"):
            {
                this.input.x += 1;

                break;
            }

            case ("Space"):
            {
                this.OnDashStart();

                break;
            }

            case ("ShiftLeft"):
            {
                this.OnShotStart();

                break;
            }
        }
    }

    OnKeyUp(_event)
    {
        switch (_event.code)
        {
            case ("KeyW"):
            {
                this.input.y -= 1;

                break;
            }

            case ("KeyA"):
            {
                this.input.x += 1;

                break;
            }

            case ("KeyS"):
            {
                this.input.y += 1;

                break;
            }

            case ("KeyD"):
            {
                this.input.x -= 1;

                break;
            }

            case ("Space"):
            {
                this.OnDashStop();

                break;
            }
        }
    }

    OnGamepadButtonDown(_button, _name)
    {
        switch (_name)
        {
            case ("L1"):
            {
                this.OnDashStart();

                break;
            }

            case ("L2"):
            {
                this.OnBlockStart();

                break;
            }

            case ("R1"):
            {
                this.OnShotStart();

                break;
            }

            case ("R2"):
            {
                this.OnAttackStart();

                break;
            }
        }
    }

    OnGamepadButtonUp(_button, _name)
    {
        switch (_name)
        {
            case ("L1"):
            {
                this.OnDashStop();

                break;
            }

            case ("L2"):
            {
                this.OnBlockStop();

                break;
            }

            case ("R2"):
            {
                this.OnAttackStop();

                break;
            }
        }
    }

    OnGamepadLeftStick(_valueX, _valueY)
    {
        this.input = new Vector2
        (
            Math.abs(_valueX) > this.deadzone ? _valueX : 0, 
            Math.abs(-_valueY) > this.deadzone ? -_valueY : 0
        );
    }

    OnGamepadRightStick(_valueX, _valueY)
    {
        this.rightJoystickInput = new Vector2
        (
            Math.abs(_valueX) > this.deadzone ? _valueX : 0, 
            Math.abs(-_valueY) > this.deadzone ? -_valueY : 0
        );
    }

    UpdateAnimator()
    {
        let _x;
        let _y;

        const _direction = Vector2.Subtract(this.dashCursor.safePivot.transform.position, this.gameObject.transform.position);

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

    OnDestroy()
    {
        this.UnbindListeners();
    }
}

export class Player extends GameObject
{
    constructor(scene, name="Player", parent=null)
    {
        super(scene, name, parent);
        
        this.fixedAnimationClip = new AnimationClip("FixedAnim", 0, 8, 0, false, false);

        this.renderer = this.AddComponent(SpriteRenderer, new Sprite(this.scene.playerTexture, undefined, undefined, new Vector2(32, 32)));
        this.animator = this.AddComponent(Animator, this.renderer, 8, [this.fixedAnimationClip]);

        this.col = this.AddComponent(PlayerCollider);

        this.deathSFX = new GameObject(this.scene, "DeathSFX").AddComponent(AudioPlayer, "source/tireless/resources/audio/Shared/Tireless_DeathSound.wav", Engine.I.sfxMixer);

        this.controller = this.AddComponent(PlayerController);
    }
}

export class BlockCursor extends GameObject
{
    constructor(scene, name="BlockCursor", parent=null)
    {
        super(scene, name, parent);

        this.canBlockAnim = new AnimationClip("CanBlockAnim", 0, 0, 1, false, false);
        this.blockAnim = new AnimationClip("BlockAnim", 1, 1, 1, false, false);
        this.cannotBlockAnim = new AnimationClip("CannotBlockAnim", 2, 2, 1, false, false);

        this.renderer = this.AddComponent(SpriteRenderer, new Sprite(this.scene.blockCursorTexture, undefined, undefined, new Vector2(16, 16)));
        this.animator = this.AddComponent(Animator, this.renderer, 3, [this.canBlockAnim, this.blockAnim, this.cannotBlockAnim]);
    }
}

export class DashCursor extends GameObject
{
    constructor(scene, name="DashCursor", parent=null)
    {
        super(scene, name, parent);

        this.pivot = new GameObject(this.scene, "Pivot", this.transform);

        this.safePivot = new GameObject(this.scene, "SavePivot", this.transform);
        this.safePivot.transform.localPosition = new Vector2(0, 64);

        this.renderer = this.pivot.AddComponent(SpriteRenderer, new Sprite(this.scene.dashCursorTexture, undefined, undefined, new Vector2(16, 16)));
        this.animator = this.pivot.AddComponent(Animator, this.renderer, 3, [this.transform.parent.gameObject.fixedAnimationClip]);

        this.blockCursor = new BlockCursor(this.scene, undefined, this.safePivot.transform);
        this.blockCursor.transform.localPosition = new Vector2(0, -48);
    }
}