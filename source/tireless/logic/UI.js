import 
{
    GameObject,
    SpriteRenderer,
    Sprite,
    Animator,
    AnimationClip,
    Component,
    TextData,
    UICanvas,
    UIElement,
    Vector2,
    Engine
} from "/source/engine/rebound.js";

import
{
    MainMenu
} from "/source/tireless/scenes/mainMenu.js";

import
{
    Alleyway
} from "/source/tireless/scenes/alleyway.js";

import
{
    LevelTransition,
    LevelTransitionFader
} from "/source/tireless/scenes/levelTransition.js";

export class BlockUI extends GameObject
{
    constructor(scene, name="BlockUI", parent=null)
    {
        super(scene, name, parent);

        this.OnDrainAnimationComplete = this.OnDrainAnimationComplete.bind(this);
        this.OnFillAnimationComplete = this.OnFillAnimationComplete.bind(this);

        this.drainBarAnim = new AnimationClip("DrainBarAnim", 0, 33, 0.03, false, false, this.OnDrainAnimationComplete);
        this.fillBarAnim = new AnimationClip("FillBarAnim", 34, 67, 0.1, false, false, this.OnFillAnimationComplete);

        this.renderer = this.AddComponent(SpriteRenderer, new Sprite(this.scene.blockUITexture, Engine.I.UI_DEFAULT_LAYER, undefined, new Vector2(64, 16)));
        this.animator = this.AddComponent(Animator, this.renderer, 68, [this.drainBarAnim, this.fillBarAnim]);
    }

    OnDrainAnimationComplete()
    {
        if (!this.animator._reversing)
        {
            this.animator.SetClip("FillBarAnim");

            this.scene.player.controller.dashCursor.blockCursor.animator.SetClip("CannotBlockAnim");
            this.scene.player.controller.blocking = false;
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

export class DashUI extends GameObject
{
    constructor(scene, name="DashUI", parent=null)
    {
        super(scene, name, parent);

        this.OnCooldownAnimationComplete = this.OnCooldownAnimationComplete.bind(this);

        this.readyBarAnim = new AnimationClip("ReadyBarAnim", 0, 4, 0.1, true, true);
        this.selectBarAnim = new AnimationClip("SelectBarAnim", 5, 7, 0.1, true, true);
        this.activeBarAnim = new AnimationClip("ActiveBarAnim", 8, 10, 0.1, true, true);
        this.cooldownBarAnim = new AnimationClip("CooldownBarAnim", 11, 17, 0.5, false, true, this.OnCooldownAnimationComplete);

        this.renderer = this.AddComponent(SpriteRenderer, new Sprite(this.scene.dashUITexture, Engine.I.UI_DEFAULT_LAYER, undefined, new Vector2(3, 16)));
        this.animator = this.AddComponent(Animator, this.renderer, 16, [this.readyBarAnim, this.selectBarAnim, this.activeBarAnim, this.cooldownBarAnim]);
    }

    OnCooldownAnimationComplete()
    {
        this.animator.SetClip("ReadyBarAnim");

        this.scene.player.controller.dashCursor.animator.JumpToFrame(0);
    }
}

export class HealthUIUpdater extends Component
{
    constructor(gameObject)
    {
        super(gameObject);
    }

    Update()
    {
        if (this.gameObject.scene.player == undefined) { return; }

        switch (this.gameObject.scene.player.controller.health)
        {
            case (100):
            {
                this.gameObject.animator.JumpToFrame(0);

                break;
            }

            case (75):
            {
                this.gameObject.animator.JumpToFrame(5);

                break;
            }

            case (50):
            {
                this.gameObject.animator.JumpToFrame(10);

                break;
            }

            case (25):
            {
                this.gameObject.animator.JumpToFrame(15);

                break;
            }

            case (0):
            {
                this.gameObject.animator.JumpToFrame(18);

                break;
            }
        }
    }
}

export class HealthUI extends GameObject
{
    constructor(scene, name="HealthUI", parent=null)
    {
        super(scene, name, parent);

        this.OnDrainAnimationComplete = this.OnDrainAnimationComplete.bind(this);

        this.drainBarAnim = new AnimationClip("DrainBarAnim", 0, 18, 0.1, false, false, this.OnDrainAnimationComplete);

        this.renderer = this.AddComponent(SpriteRenderer, new Sprite(this.scene.healthUITexture, Engine.I.UI_DEFAULT_LAYER, undefined, new Vector2(64, 16)));
        this.animator = this.AddComponent(Animator, this.renderer, 19, [this.drainBarAnim]);

        this.updater = this.AddComponent(HealthUIUpdater);
    }

    OnDrainAnimationComplete()
    {

    }
}

export class EnemyHealthUI extends GameObject
{
    constructor(scene, name="EnemyHealthUI", parent=null)
    {
        super(scene, name, parent);

        this.OnDrainAnimationComplete = this.OnDrainAnimationComplete.bind(this);

        this.drainBarAnim = new AnimationClip("DrainBarAnim", 0, 4, 0.1, false, false, this.OnDrainAnimationComplete);

        this.renderer = this.AddComponent(SpriteRenderer, new Sprite(this.scene.enemyHealthUITexture, Engine.I.UI_DEFAULT_LAYER, undefined, new Vector2(32, 3)));
        this.animator = this.AddComponent(Animator, this.renderer, 5, [this.drainBarAnim]);
    }

    OnDrainAnimationComplete()
    {

    }
}

class SceneSwapButton extends UIElement
{
    constructor(gameObject, canvas, animator, target, textData=new TextData("UI ELEMENT", "8px VCR_OSD_MONO", "white", undefined, undefined, Engine.I.UI_TEXT_DEFAULT_LAYER), width=32, height=32, sfx=["source/tireless/resources/audio/UI/Tireless_SFX_UISwap.wav", "source/tireless/resources/audio/UI/Tireless_SFX_UIPressDown.wav", "source/tireless/resources/audio/UI/Tireless_SFX_UIPressUp.wav"], interactable=true)
    {   
        super(gameObject, canvas, animator, textData, width, height, sfx, interactable);

        this.target = target;
    }

    OnUIClickEnd()
    {
        this.target();
    }
}

export class DeathScreenMenuButton extends GameObject
{
    constructor(scene, currentCanvasObject, localPosition, name="MenuButton", text="MAIN MENU", parent=null)
    {
        super(scene, name, parent);
        
        this.SwapScene = this.SwapScene.bind(this);

        this.clicked = false;

        this.texture = new Image();
        this.texture.src = "source/tireless/resources/textures/UI/tirelessDeathScreenButton.png";

        this.buttonAnimationClip = new AnimationClip("ButtonAnimation", 0, 3, 0, false, false);

        this.transform.localPosition = localPosition;

        this.renderer = this.AddComponent(SpriteRenderer, new Sprite(this.texture, 450, undefined, new Vector2(64, 32)));
        this.animator = this.AddComponent(Animator, this.renderer, 4, [this.buttonAnimationClip]);
        
        this.sceneSwapper = this.AddComponent(SceneSwapButton, currentCanvasObject.GetComponent(UICanvas), this.animator, this.SwapScene, new TextData(text, "8px VCR_OSD_MONO", "white", undefined, undefined, 455), 64, 32);
    }

    SwapScene()
    {
        if (this.clicked) { return; }

        let _fader = new LevelTransitionFader(this.scene, () => { Engine.I.LoadScene(new LevelTransition("Main Menu", MainMenu)); });

        this.clicked = true;
    }
}

export class DeathScreenRetryButton extends GameObject
{
    constructor(scene, currentCanvasObject, localPosition, name="RetryButton", text="RETRY", parent=null)
    {
        super(scene, name, parent);
        
        this.SwapScene = this.SwapScene.bind(this);

        this.clicked = false;

        this.texture = new Image();
        this.texture.src = "source/tireless/resources/textures/UI/tirelessDeathScreenButton.png";

        this.buttonAnimationClip = new AnimationClip("ButtonAnimation", 0, 3, 0, false, false);

        this.transform.localPosition = localPosition;

        this.renderer = this.AddComponent(SpriteRenderer, new Sprite(this.texture, 450, undefined, new Vector2(64, 32)));
        this.animator = this.AddComponent(Animator, this.renderer, 4, [this.buttonAnimationClip]);
        
        this.sceneSwapper = this.AddComponent(SceneSwapButton, currentCanvasObject.GetComponent(UICanvas), this.animator, this.SwapScene, new TextData(text, "8px VCR_OSD_MONO", "white", undefined, undefined, 455), 64, 32);
    }

    SwapScene()
    {
        if (this.clicked) { return; }

        let _fader = new LevelTransitionFader(this.scene, () => { Engine.I.LoadScene(new LevelTransition(this.scene.name, this.scene.constructor)); });

        this.clicked = true;
    }
}