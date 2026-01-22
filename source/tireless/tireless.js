import * as Rebound from "/source/engine/rebound.js";

class EntityToggleButton extends Rebound.UIElement
{
    constructor(gameObject, canvas, animator, target, text=new Rebound.TextData(gameObject, "UI ELEMENT", "8px VCR_OSD_MONO", "white", 100), width=32, height=32, interactable=true)
    {   
        super(gameObject, canvas, animator, text, width, height, interactable);

        this.target = target;
    }

    OnUIClickEnd()
    {
        this.target.enabled = !this.target.enabled;
    }
}

class MainMenu extends Rebound.Scene
{
    constructor()
    {
        super();
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

        const _uiTestCanvas = new Rebound.GameObject(this, "UI Canvas");
        const _uicanvas = _uiTestCanvas.AddComponent(Rebound.UICanvas);

        const _uiTestA = new Rebound.GameObject(this, "UI Test A", _uiTestCanvas.transform);
        const _uiTestB = new Rebound.GameObject(this, "UI Test B", _uiTestCanvas.transform);

        _uiTestA.transform.localPosition = new Rebound.Vector2(128, 142);
        _uiTestB.transform.localPosition = new Rebound.Vector2(128, 102);

        const _texC = new Image();
        _texC.src = "source/tireless/resources/textures/UI/tirelessButtonPrefab.png";

        const _uirendA = _uiTestA.AddComponent(Rebound.SpriteRenderer, new Rebound.Sprite(_texC, 1, undefined, new Rebound.Vector2(64, 32)));
        const _uianimA = _uiTestA.AddComponent(Rebound.Animator, _uirendA, 4, 0, false, false);

        const _uielemA = _uiTestA.AddComponent(EntityToggleButton, _uicanvas, _uianimA, _uiTestCanvas, undefined, 64, 32);

        const _uirendB = _uiTestB.AddComponent(Rebound.SpriteRenderer, new Rebound.Sprite(_texC, 1, undefined, new Rebound.Vector2(64, 32)));
        const _uianimB = _uiTestB.AddComponent(Rebound.Animator, _uirendB, 4, 0, false, false);

        const _uielemB = _uiTestB.AddComponent(EntityToggleButton, _uicanvas, _uianimB, _uiTestCanvas, undefined, 64, 32);

        _uielemA.text.text = "PLAY";
        _uielemB.text.text = "SETTINGS";
    }
}

const _s = new MainMenu();

new Rebound.Engine(256, 240, new Rebound.Vector2(4, 4));

Rebound.Engine.I.AddToScenes(_s);