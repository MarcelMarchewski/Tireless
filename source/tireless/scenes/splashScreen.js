import 
{
    GameObject,
    Scene,
    SpriteRenderer,
    Sprite,
    Animator,
    AnimationClip,
    Timer,
    Vector2,
    Engine
} from "/source/engine/rebound.js";

import
{
    MainMenu
} from "/source/tireless/scenes/mainMenu.js";

class SceneSwapTimer extends Timer
{
    constructor(gameObject)
    {
        super(gameObject, 1, false, true);
    }

    OnTimerUp()
    {
        this.gameObject.scene.SwapToMain();
    }
}

class RunTimer extends Timer
{
    constructor(gameObject)
    {
        super(gameObject, 3, true, true);
    }

    OnTimerUp()
    {
        this.gameObject.scene.logo.animator.Play();

        this.gameObject.GetComponent(SceneSwapTimer).Play();
    }
}

class BasicSprite extends GameObject
{
    constructor(scene, texture, frameCount, dimensions, name="Basic Sprite", parent=null)
    {
        super(scene, name, parent);

        this.renderer = this.AddComponent(SpriteRenderer, new Sprite(texture, frameCount, undefined, dimensions));
        this.animator = this.AddComponent(Animator, this.renderer, frameCount, [new AnimationClip("SplashScreenAnimation", 0, frameCount, 0.2, false, false)]);
    }
}

export class SplashScreen extends Scene
{
    constructor()
    {
        super("SplashScreen");

        this.backgroundTexture = new Image();
        this.backgroundTexture.src = "source/tireless/resources/textures/SplashScreen/splashScreenBackground.png";

        this.logoTexture = new Image();
        this.logoTexture.src = "source/tireless/resources/textures/SplashScreen/reboundLogo.png";
    }

    Start()
    {
        this.background = new BasicSprite(this, this.backgroundTexture, 1, Vector2.one, "Background");

        this.background.transform.localPosition = new Vector2(128, 128);
        this.background.transform.scale = new Vector2(256, 256);

        this.logo = new BasicSprite(this, this.logoTexture, 5, new Vector2(48, 48), "Logo");

        this.logo.transform.localPosition = new Vector2(128, 128);
        this.logo.transform.scale = new Vector2(3, 3);

        this.runTimer = this.root.AddComponent(RunTimer);
        this.sceneSwapTimer = this.root.AddComponent(SceneSwapTimer);
    }

    SwapToMain()
    {
        Engine.I.LoadScene(new MainMenu());
    }
}