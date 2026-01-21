import * as Rebound from "/source/engine/rebound.js";

class MainMenu extends Rebound.Scene
{
    constructor()
    {
        super();

        this.OnGamepadButtonDown = this.OnGamepadButtonDown.bind(this);
        this.OnGamepadButtonUp = this.OnGamepadButtonUp.bind(this);

        this.OnGamepadLeftStick = this.OnGamepadLeftStick.bind(this);
        this.OnGamepadRightStick = this.OnGamepadRightStick.bind(this);
    }

    Start()
    {
        const _title = new Rebound.GameObject(this, "Title");
        _title.transform.localPosition = new Rebound.Vector2(128, 180);
        _title.transform.localScale = new Rebound.Vector2(2, 2);

        const _texA = new Image();
        _texA.src = "source/tireless/resources/textures/MainMenu/tirelessTitle.png";

        const _rend = _title.AddComponent(Rebound.SpriteRenderer, new Rebound.Sprite(_texA, 1, undefined, new Rebound.Vector2(96, 32)));
        _title.AddComponent(Rebound.Animator, _rend, 9);

        const _background = new Rebound.GameObject(this, "Background");
        _background.transform.localPosition = new Rebound.Vector2(128, 120);

        const _texB = new Image();
        _texB.src = "source/tireless/resources/textures/MainMenu/tirelessTitleBackground.png";

        _background.AddComponent(Rebound.SpriteRenderer, new Rebound.Sprite(_texB, 0));

        this.inputManager.AddGamepadButtonDownListener(this.OnGamepadButtonDown);
        this.inputManager.AddGamepadButtonUpListener(this.OnGamepadButtonUp);

        this.inputManager.AddGamepadLeftStickListener(this.OnGamepadLeftStick);
        this.inputManager.AddGamepadRightStickListener(this.OnGamepadRightStick);
    }

    OnGamepadButtonDown(_button, _name)
    {
        
    }

    OnGamepadButtonUp(_button, _name)
    {
        
    }

    OnGamepadLeftStick(_valueX, _valueY)
    {
        
    }

    OnGamepadRightStick(_valueX, _valueY)
    {
        
    }
}

const _s = new MainMenu();

new Rebound.Engine(256, 240, new Rebound.Vector2(4, 4));

Rebound.Engine.I.AddToScenes(_s);