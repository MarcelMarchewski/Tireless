import * as Rebound from "/source/engine/rebound.js";

class EntityToggleButton extends Rebound.UIElement
{
    constructor(gameObject, canvas, animator, text=new Rebound.TextData(gameObject, "UI ELEMENT", "8px VCR_OSD_MONO", "white", Rebound.Engine.I.UI_TEXT_DEFAULT_LAYER), width=32, height=32, interactable=true)
    {   
        super(gameObject, canvas, animator, text, width, height, interactable);

        this.targets = [];
    }

    OnUIClickEnd()
    {
        for (let i = 0; i < this.targets.length; i++)
        {
            this.targets[i].enabled = !this.targets[i].enabled;
        }
    }
}

class SettingsMenuCanvas extends Rebound.GameObject
{
    constructor(scene, name="Settings Menu Canvas", parent=null)
    {
        super(scene, name, parent);

        this.canvas = this.AddComponent(Rebound.UICanvas);

        this.backButton = new NextCanvasButton(this.scene, this, new Rebound.Vector2(128, 102), "Back Button", "BACK", this.transform);
    }
}

class MainMenuCanvas extends Rebound.GameObject
{
    constructor(scene, name="Main Menu Canvas", parent=null)
    {
        super(scene, name, parent);

        this.canvas = this.AddComponent(Rebound.UICanvas);

        this.settingsButton = new NextCanvasButton(this.scene, this, new Rebound.Vector2(128, 102), "Settings Button", "SETTINGS", this.transform);
    }
}

class NextCanvasButton extends Rebound.GameObject
{
    constructor(scene, currentCanvasObject, localPosition, name="Next Canvas Button", text="NEXT CANVAS", parent=null)
    {
        super(scene, name, parent);

        this.transform.localPosition = localPosition;

        this.renderer = this.AddComponent(Rebound.SpriteRenderer, new Rebound.Sprite(this.scene.uiButtonTexture, Rebound.Engine.I.UI_DEFAULT_LAYER, undefined, new Rebound.Vector2(64, 32)));
        this.animator = this.AddComponent(Rebound.Animator, this.renderer, 4, 0, false, false);
        
        this.toggle = this.AddComponent(EntityToggleButton, currentCanvasObject.GetComponent(Rebound.UICanvas), this.animator, new Rebound.TextData(this, text, "8px VCR_OSD_MONO", "white", Rebound.Engine.I.UI_TEXT_DEFAULT_LAYER), 64, 32);
    }
}

class MainMenu extends Rebound.Scene
{
    constructor()
    {
        super();

        this.backgroundTexture = new Image();
        this.backgroundTexture.src = "source/tireless/resources/textures/MainMenu/tirelessTitleBackground.png";

        this.logoTexture = new Image();
        this.logoTexture.src = "source/tireless/resources/textures/MainMenu/tirelessTitle.png";

        this.uiButtonTexture = new Image();
        this.uiButtonTexture.src = "source/tireless/resources/textures/UI/tirelessButtonPrefab.png";
    }

    SetupButtonTargets()
    {
        this.mainMenuCanvas.settingsButton.toggle.targets = [this.mainMenuCanvas, this.settingsMenuCanvas];
        this.settingsMenuCanvas.backButton.toggle.targets = [this.settingsMenuCanvas, this.mainMenuCanvas];
    }

    Start()
    {
        this.backgroundRenderer = new Rebound.GameObject(this, "Background Renderer").AddComponent(Rebound.SpriteRenderer, new Rebound.Sprite(this.backgroundTexture, 0));
        this.backgroundRenderer.gameObject.transform.localPosition = new Rebound.Vector2(128, 120);

        this.logoRenderer = new Rebound.GameObject(this, "Logo Renderer").AddComponent(Rebound.SpriteRenderer, new Rebound.Sprite(this.logoTexture, 1, undefined, new Rebound.Vector2(96, 32)));
        this.logoAnimator = this.logoRenderer.gameObject.AddComponent(Rebound.Animator, this.logoRenderer, 9);

        this.logoRenderer.gameObject.transform.localPosition = new Rebound.Vector2(128, 180);
        this.logoRenderer.gameObject.transform.localScale = new Rebound.Vector2(2, 2);

        this.settingsMenuCanvas = new SettingsMenuCanvas(this);
        this.settingsMenuCanvas.enabled = false;

        this.mainMenuCanvas = new MainMenuCanvas(this);

        this.SetupButtonTargets();
    }
}

const _s = new MainMenu();

new Rebound.Engine(256, 240, new Rebound.Vector2(4, 4));

Rebound.Engine.I.AddToScenes(_s);