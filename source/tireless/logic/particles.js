import 
{
    Component,
    GameObject,
    SpriteRenderer,
    Sprite,
    Animator,
    AnimationClip,
    Timer,
    Vector2,
    Engine
} from "/source/engine/rebound.js";

class Particle extends GameObject
{
    constructor(scene, sprite, frameCount, animationClip, destructive=true, name="Particle", parent=null)
    {
        super(scene, name, parent);

        this.animationClip = animationClip;

        this.renderer = this.AddComponent(SpriteRenderer, sprite);
        this.animator = this.AddComponent(Animator, this.renderer, frameCount, [this.animationClip]);

        this.animationClip.onComplete = this.Base_OnAnimationComplete();
    }

    Base_OnAnimationComplete()
    {
        this.OnAnimationComplete();

        if (this.destructive)
        {
            this.Base_Destroy();
        }
    }

    OnAnimationComplete()
    {
        
    }
}