import 
{
    Component,
    GameObject,
    Scene,
    SpriteRenderer,
    TilemapRenderer,
    Sprite,
    Animator,
    AnimationClip,
    UICanvas,
    TextData,
    AABB,
    Vector2,
    Engine,
    AudioPlayer
} from "/source/engine/rebound.js";

class WorldCollider extends AABB
{
    constructor(gameObject, dimensions)
    {
        super(gameObject, dimensions);
    }
}

class PlayerCollider extends AABB
{
    constructor(gameObject, dimensions=new Vector2(26, 26))
    {
        super(gameObject, dimensions);

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
    }
}

class PlayerController extends Component
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

        this.dashCursor = new DashCursor(this.gameObject.scene, undefined, this.gameObject.transform);
        this.dashCursor.renderer.enabled = false;
        
        this.blockCursor = this.dashCursor.blockCursor;
        this.blockCursor.renderer.enabled = false;

        this.dashing = false;
        this.dashHeld = false;

        this.blocking = false;
    }

    Start()
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

    Update()
    {
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
                const _hit = this.gameObject.scene.colliderManager.Raycast(this.gameObject.transform.position, _direction, 80, 2, [PlayerCollider]);

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
        }

        this.blockCursor.renderer.enabled = true;
    }

    OnBlockStop()
    {
        if (this.blocking && this.gameObject.scene.blockUI.animator.currentClip.name != "FillBarAnim")
        {
            this.gameObject.scene.blockUI.animator.Reverse();

            this.gameObject.scene.blockUI.animator.currentClip.frameDuration = this.blockRefillSpeed;
        }

        this.blockCursor.renderer.enabled = false;

        this.blocking = false;
    }

    OnMouseDown(_event)
    {
        switch (_event.button)
        {
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
            case ("L2"):
            {
                this.OnDashStart();

                break;
            }

            case ("RStick"):
            {
                this.OnBlockStart();

                break;
            }
        }
    }

    OnGamepadButtonUp(_button, _name)
    {
        switch (_name)
        {
            case ("L2"):
            {
                this.OnDashStop();

                break;
            }

            case ("RStick"):
            {
                this.OnBlockStop();

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

class Player extends GameObject
{
    constructor(scene, name="Player", parent=null)
    {
        super(scene, name, parent);
        
        this.fixedAnimationClip = new AnimationClip("FixedAnim", 0, 8, 0, false, false);

        this.renderer = this.AddComponent(SpriteRenderer, new Sprite(this.scene.playerTexture, undefined, undefined, new Vector2(32, 32)));
        this.animator = this.AddComponent(Animator, this.renderer, 8, [this.fixedAnimationClip]);

        this.col = this.AddComponent(PlayerCollider);

        this.controller = this.AddComponent(PlayerController);
    }
}

class BlockCursor extends GameObject
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

class DashCursor extends GameObject
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

class BlockUI extends GameObject
{
    constructor(scene, name="BlockUI", parent=null)
    {
        super(scene, name, parent);

        this.OnDrainAnimationComplete = this.OnDrainAnimationComplete.bind(this);
        this.OnFillAnimationComplete = this.OnFillAnimationComplete.bind(this);

        this.drainBarAnim = new AnimationClip("DrainBarAnim", 0, 33, 0.03, false, false, this.OnDrainAnimationComplete);
        this.fillBarAnim = new AnimationClip("FillBarAnim", 34, 67, 0.1, false, false, this.OnFillAnimationComplete);

        this.renderer = this.AddComponent(SpriteRenderer, new Sprite(this.scene.blockUITexture, undefined, undefined, new Vector2(64, 16)));
        this.animator = this.AddComponent(Animator, this.renderer, 68, [this.drainBarAnim, this.fillBarAnim]);
    }

    OnDrainAnimationComplete()
    {
        if (!this.animator._reversing)
        {
            this.animator.SetClip("FillBarAnim");

            this.scene.player.controller.dashCursor.blockCursor.animator.SetClip("CannotBlockAnim");
        }
    }

    OnFillAnimationComplete()
    {
        this.animator.SetClip("DrainBarAnim");
        this.animator.Stop();

        this.scene.player.controller.dashCursor.blockCursor.animator.SetClip("CanBlockAnim");
        this.scene.player.controller.dashCursor.blockCursor.renderer.enabled = false;
    }
}

class DashUI extends GameObject
{
    constructor(scene, name="DashUI", parent=null)
    {
        super(scene, name, parent);

        this.OnCooldownAnimationComplete = this.OnCooldownAnimationComplete.bind(this);

        this.readyBarAnim = new AnimationClip("ReadyBarAnim", 0, 4, 0.1, true, true);
        this.selectBarAnim = new AnimationClip("SelectBarAnim", 5, 7, 0.1, true, true);
        this.activeBarAnim = new AnimationClip("ActiveBarAnim", 8, 10, 0.1, true, true);
        this.cooldownBarAnim = new AnimationClip("CooldownBarAnim", 11, 17, 0.5, false, true, this.OnCooldownAnimationComplete);

        this.renderer = this.AddComponent(SpriteRenderer, new Sprite(this.scene.dashUITexture, undefined, undefined, new Vector2(3, 16)));
        this.animator = this.AddComponent(Animator, this.renderer, 16, [this.readyBarAnim, this.selectBarAnim, this.activeBarAnim, this.cooldownBarAnim]);
    }

    OnCooldownAnimationComplete()
    {
        this.animator.SetClip("ReadyBarAnim");

        if (this.scene.player.controller.dashCursor.animator.currentFrame)
        {
            this.scene.player.controller.dashCursor.animator.JumpToFrame(0);
        }
    }
}

export class Gym extends Scene
{
    constructor()
    {
        super();

        this.playerTexture = new Image();
        this.playerTexture.src = "source/tireless/resources/textures/Shared/tirelessPlayerSamurai.png";

        this.dashCursorTexture = new Image();
        this.dashCursorTexture.src = "source/tireless/resources/textures/Shared/dashCursor.png";

        this.blockCursorTexture = new Image();
        this.blockCursorTexture.src = "source/tireless/resources/textures/Shared/blockCursor.png";

        this.backgroundTexture = new Image();
        this.backgroundTexture.src = "source/tireless/resources/textures/Gym/gymBackground.png";

        this.blockUITexture = new Image();
        this.blockUITexture.src = "source/tireless/resources/textures/UI/tirelessBlockSlider.png";

        this.dashUITexture = new Image();
        this.dashUITexture.src = "source/tireless/resources/textures/UI/tirelessDashBar.png";
    }

    Start()
    {
        this.backgroundRenderer = new GameObject(this, "Background Renderer").AddComponent(TilemapRenderer, new Sprite(this.backgroundTexture, undefined, undefined, new Vector2(16, 16)), "source/tireless/resources/data/tilemaps/gym.json");
        this.backgroundRenderer.gameObject.transform.localPosition = new Vector2(128, 128);

        this.player = new Player(this);

        this.blockUI = new BlockUI(this);
        this.blockUI.transform.position = new Vector2(48, 24);

        this.dashUI = new DashUI(this);
        this.dashUI.transform.position = new Vector2(80, 24);

        this.testCol = new GameObject(this, "TestCol").AddComponent(WorldCollider, new Vector2(32, 32));

        this.testCol.renderer = new GameObject(this, "Renderer", this.testCol.gameObject.transform).AddComponent(SpriteRenderer, new Sprite(Engine.I.missingTexture, undefined, undefined, new Vector2(2, 2)));
        this.testCol.renderer.gameObject.transform.scale = new Vector2(16, 16);

        this.testCol.gameObject.transform.position = new Vector2(128, 128);
    }
}