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

        this.input = Vector2.zero;

        this.rightJoystickInput = Vector2.zero;

        this.directionDegrees = 0;

        this.dashCursor = new DashCursor(this.gameObject.scene, undefined, this.gameObject.transform);
        this.dashCursor.enabled = false;

        this.dashing = false;
    }

    Start()
    {
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

                this.dashCursor.enabled = false;
            }
        }

        this.UpdateAnimator();
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
                if (!this.dashing)
                {
                    this.dashCursor.animator.JumpToFrame(0);
                    this.dashCursor.enabled = true;
                }

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
                if (!this.dashing)
                {
                    this.dashCursor.animator.JumpToFrame(1);

                    this.dashing = true;
                }

                else
                {
                    this.dashCursor.transform.parent = this.gameObject.transform;
                    this.dashCursor.transform.localPosition = Vector2.zero;

                    this.dashing = false;

                    this.dashCursor.enabled = false;
                }

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
                if (!this.dashing)
                {
                    this.dashCursor.animator.JumpToFrame(0);
                    this.dashCursor.enabled = true;
                }

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
                this.dashCursor.animator.JumpToFrame(1);

                this.dashing = true;

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

        this.renderer = this.AddComponent(SpriteRenderer, new Sprite(this.scene.playerTexture, undefined, undefined, new Vector2(32, 32)));
        this.animator = this.AddComponent(Animator, this.renderer, 8, [this.scene.fixedAnimationClip]);

        this.col = this.AddComponent(PlayerCollider);

        this.controller = this.AddComponent(PlayerController);
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
        this.animator = this.pivot.AddComponent(Animator, this.renderer, 2, [this.scene.fixedAnimationClip]);
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

        this.backgroundTexture = new Image();
        this.backgroundTexture.src = "source/tireless/resources/textures/Gym/gymBackground.png";

        this.fixedAnimationClip = new AnimationClip("FixedAnim", 0, 8, 0, false, false);
    }

    Start()
    {
        this.backgroundRenderer = new GameObject(this, "Background Renderer").AddComponent(TilemapRenderer, new Sprite(this.backgroundTexture, undefined, undefined, new Vector2(16, 16)), "source/tireless/resources/data/tilemaps/gym.json");
        this.backgroundRenderer.gameObject.transform.localPosition = new Vector2(128, 128);

        this.player = new Player(this);

        this.testCol = new GameObject(this, "TestCol").AddComponent(WorldCollider, new Vector2(32, 32));

        this.testCol.renderer = new GameObject(this, "Renderer", this.testCol.gameObject.transform).AddComponent(SpriteRenderer, new Sprite(Engine.I.missingTexture, undefined, undefined, new Vector2(2, 2)));
        this.testCol.renderer.gameObject.transform.scale = new Vector2(16, 16);

        this.testCol.gameObject.transform.position = new Vector2(128, 128);
    }
}