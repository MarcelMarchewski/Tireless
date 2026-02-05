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
        this.deadzone = 0.15;

        this.input = Vector2.zero;
    }

    Start()
    {
        this.gameObject.scene.inputManager.AddKeyDownListener(this.OnKeyDown);
        this.gameObject.scene.inputManager.AddKeyUpListener(this.OnKeyUp);

        this.gameObject.scene.inputManager.AddGamepadLeftStickListener(this.OnGamepadLeftStick);
    }

    Update()
    {
        this.gameObject.transform.localPosition.Add(Vector2.Multiply(this.input.normalised, new Vector2(Engine.I.deltaTime * _moveSpeed, Engine.I.deltaTime * _moveSpeed)));
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
        const _x = Math.abs(this.input.x) > this.deadzone ? this.input.x : 0;
        const _y = Math.abs(this.input.y) > this.deadzone ? this.input.y : 0;

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

        this.renderer = this.AddComponent(SpriteRenderer, new Sprite(this.scene.playerTexture, undefined, undefined, new Vector2(16, 16)));
        this.animator = this.AddComponent(Animator, this.renderer, 8, 0, false, false);

        this.controller = this.AddComponent(PlayerController);
    }
}

export class Gym extends Scene
{
    constructor()
    {
        super();

        this.playerTexture = new Image();
        this.playerTexture.src = "source/tireless/resources/textures/Shared/tirelessPlayer.png";

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