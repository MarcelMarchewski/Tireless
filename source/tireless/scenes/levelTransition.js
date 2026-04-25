import 
{
    GameObject,
    Scene,
    SpriteRenderer,
    TilemapRenderer,
    TextRenderer,
    TextData,
    Sprite,
    Animator,
    AnimationClip,
    Timer,
    AABB,
    Vector2,
    Engine
} from "/source/engine/rebound.js";

export class LevelTransitionDisplayTimer extends Timer
{
    constructor(gameObject, startValue=1.5, autoplay=true, destructive=true)
    {
        super(gameObject, startValue, autoplay, destructive);
    }

    Update()
    {
        super.Update();
    }

    OnTimerUp()
    {
        this.gameObject.animator.Reverse();
        this.gameObject.animator.Play();
    }
}

export class LevelTransition extends Scene
{
    constructor(nextLevelTitle, nextLevelType, ...args)
    {
        super();

        this.backgroundTexture = new Image();
        this.backgroundTexture.src = "source/tireless/resources/textures/LevelTransition/tirelessLevelTitleCard.png";

        this.nextLevelTitle = nextLevelTitle;
        this.nextLevelType = nextLevelType;

        this.args = args;
    }

    Start()
    {
        this.OnAnimationComplete = this.OnAnimationComplete.bind(this);

        this.transitionAnim = new AnimationClip("TransitionAnim", 0, 3, 0.1, false, true, this.OnAnimationComplete);

        this.background = new GameObject(this, "Background");

        this.background.renderer = this.background.AddComponent(SpriteRenderer, new Sprite(this.backgroundTexture, 0, undefined, new Vector2(256, 256)));
        this.background.animator = this.background.AddComponent(Animator, this.background.renderer, 4, [this.transitionAnim]);
        
        this.background.transform.localPosition = new Vector2(128, 128);

        this.titleCard = new GameObject(this, "TitleCard");

        this.titleCard.renderer = this.background.AddComponent(TextRenderer, new TextData(this.nextLevelTitle, "8px VCR_OSD_MONO", "black", "center", "middle", Engine.I.UI_TEXT_DEFAULT_LAYER));

        this.titleCard.transform.localPosition = new Vector2(128, 128);
    }

    OnAnimationComplete()
    {
        if (!this.background.animator._reversing)
        {
            let _timer = this.background.AddComponent(LevelTransitionDisplayTimer);
        }

        else
        {
            Engine.I.LoadScene(new this.nextLevelType(...this.args));
        }
    }
}

export class LevelTransitionFader extends GameObject
{
    constructor(scene, onAnimationComplete=() => {  }, polarity=false, name="LevelTransitionFader", parent=null)
    {
        super(scene, name, parent);

        this.polarity = polarity;
        
        this.onAnimationComplete = onAnimationComplete;

        this.texture = new Image();
        this.texture.src = "source/tireless/resources/textures/LevelTransition/tirelessLevelFader.png";

        this.fadeAnim = new AnimationClip("FadeAnim", 0, 3, 0.1, false, true, this.onAnimationComplete);

        this.renderer = this.AddComponent(SpriteRenderer, new Sprite(this.texture, 500, undefined, new Vector2(1, 1)));
        this.animator = this.AddComponent(Animator, this.renderer, 4, [this.fadeAnim]);

        if (this.polarity)
        {   
            this.animator.Reverse();
            this.animator.JumpToFrame(3);
        }

        this.transform.position = new Vector2(128, 128);
        this.transform.scale = new Vector2(256, 256);
    }
}