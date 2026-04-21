import 
{
    GameObject,
    SpriteRenderer,
    Sprite,
    Animator,
    AnimationClip,
    Vector2
} from "/source/engine/rebound.js";

export class BlockUI extends GameObject
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