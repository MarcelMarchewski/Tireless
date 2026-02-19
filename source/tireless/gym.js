import 
{
    Component,
    GameObject,
    Scene,
    SpriteRenderer,
    TilemapRenderer,
    Sprite,
    Animator,
    UICanvas,
    TextData,
    Vector2,
    Engine,
    AudioPlayer
} from "/source/engine/rebound.js";

class PlayerController extends Component
{
    constructor(gameObject)
    {
        super(gameObject);

        this.OnKeyDown = this.OnKeyDown.bind(this);
        this.OnKeyUp = this.OnKeyUp.bind(this);
        
        this.OnGamepadLeftStick = this.OnGamepadLeftStick.bind(this);

        this.animator = this.gameObject.GetComponent(Animator);

        this.speed = 150;
        this.dashSpeed = 400;
        this.deadzone = 0.15;

        this.input = Vector2.zero;

        this.dashCursor = new DashCursor(this.gameObject.scene, undefined, this.gameObject.transform);
        this.dashCursor.enabled = false;

        this.dashing = false;
    }

    Start()
    {
        this.gameObject.scene.inputManager.AddKeyDownListener(this.OnKeyDown);
        this.gameObject.scene.inputManager.AddKeyUpListener(this.OnKeyUp);

        this.gameObject.scene.inputManager.AddGamepadLeftStickListener(this.OnGamepadLeftStick);
    }

    Update()
    {
        if (!this.dashing)
        {
            this.gameObject.transform.localPosition.Add(Vector2.Multiply(this.input.normalised, new Vector2(Engine.I.deltaTime * this.speed, Engine.I.deltaTime * this.speed)));

            const _mousePos = this.gameObject.scene.cursorManager.cursorPosition;

            this.dashCursor.transform.localRotation = Vector2.DegreeAngle(this.gameObject.transform.position, _mousePos) - 90;
        }

        else
        {
            if (this.dashCursor.transform.parent != null)
            {
                this.dashCursor.transform.parent = null;
            }

            const _direction = Vector2.Subtract(this.gameObject.transform.position, this.dashCursor.pivot.transform.position);

            if (_direction.magnitude > 10)
            {
                const _dash = Vector2.Multiply(_direction.normalised, new Vector2(Engine.I.deltaTime * this.dashSpeed * -1, Engine.I.deltaTime * this.dashSpeed * -1));

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

        this.UpdateAnimator();
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
                this.dashCursor.animator.JumpToFrame(1);

                this.dashing = true;

                break;
            }
        }

        this.UpdateAnimator();
    }

    OnGamepadLeftStick(_valueX, _valueY)
    {
        this.input = new Vector2
        (
            Math.abs(_valueX) > this.deadzone ? _valueX : 0, 
            Math.abs(-_valueY) > this.deadzone ? -_valueY : 0
        );

        this.UpdateAnimator();
    }

    UpdateAnimator()
    {
        let _x;
        let _y;

        if (!this.dashing)
        {
            _x = Math.abs(this.input.x) > this.deadzone ? this.input.x : 0;
            _y = Math.abs(this.input.y) > this.deadzone ? this.input.y : 0;
        }

        else
        {
            const _direction = Vector2.Subtract(this.gameObject.transform.position, this.dashCursor.pivot.transform.position);

            _x = -_direction.x;
            _y = -_direction.y;
        }

        if (_x == 0 && _y == 0) { return; }

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

        this.animator.JumpToFrame(_frame);
    }
}

class Player extends GameObject
{
    constructor(scene, name="Player", parent=null)
    {
        super(scene, name, parent);

        this.renderer = this.AddComponent(SpriteRenderer, new Sprite(this.scene.playerTexture, undefined, undefined, new Vector2(32, 32)));
        this.animator = this.AddComponent(Animator, this.renderer, 8, 0, false, false);

        this.controller = this.AddComponent(PlayerController);
    }
}

class DashCursor extends GameObject
{
    constructor(scene, name="DashCursor", parent=null)
    {
        super(scene, name, parent);

        this.pivot = new GameObject(this.scene, "Pivot", this.transform);
        this.pivot.transform.localPosition.Add(new Vector2(0, 64));

        this.renderer = this.pivot.AddComponent(SpriteRenderer, new Sprite(this.scene.dashCursorTexture, undefined, undefined, new Vector2(16, 16)));
        this.animator = this.pivot.AddComponent(Animator, this.renderer, 8, 0, false, false);
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
    }

    Start()
    {
        this.backgroundRenderer = new GameObject(this, "Background Renderer").AddComponent(TilemapRenderer, new Sprite(this.backgroundTexture, undefined, undefined, new Vector2(16, 16)), "source/tireless/resources/data/tilemaps/gym.json");
        this.backgroundRenderer.gameObject.transform.localPosition = new Vector2(128, 120);

        this.player = new Player(this);
    }
}