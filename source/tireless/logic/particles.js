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

export class Particle extends GameObject
{
    constructor(scene, sprite, frameCount, animationClip, destructive=true, name="Particle", parent=null)
    {
        super(scene, name, parent);

        this.Base_OnAnimationComplete = this.Base_OnAnimationComplete.bind(this);
        this.OnAnimationComplete = this.OnAnimationComplete.bind(this);

        this.animationClip = animationClip;

        this.renderer = this.AddComponent(SpriteRenderer, sprite);
        this.animator = this.AddComponent(Animator, this.renderer, frameCount, [this.animationClip]);

        this.animationClip.onComplete = this.Base_OnAnimationComplete;

        this.destructive = destructive;
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

export class SwordAttackParticle extends Particle
{
    constructor(scene)
    {
        let _texture = new Image();
        _texture.src = "source/tireless/resources/textures/Shared/tirelessSwordSlash.png";

        let _sprite = new Sprite(_texture, Engine.I.PARTICLE_DEFAULT_LAYER, undefined, new Vector2(16, 16));

        let _animationClip = new AnimationClip("SlashAnim", 0, 3, 0.1, false, true);

        super(scene, _sprite, 4, _animationClip, true, "SwordAttackParticle", null);
    }
}

export class SwordParryParticle extends Particle
{
    constructor(scene)
    {
        let _texture = new Image();
        _texture.src = "source/tireless/resources/textures/Shared/tirelessSwordParry.png";

        let _sprite = new Sprite(_texture, Engine.I.PARTICLE_DEFAULT_LAYER, undefined, new Vector2(32, 32));

        let _animationClip = new AnimationClip("ParryAnim", 0, 4, 0.1, false, true);

        super(scene, _sprite, 5, _animationClip, true, "SwordParryParticle", null);

        this.transform.scale = new Vector2(0.5, 0.5);
    }
}

export class BlockParticle extends Particle
{
    constructor(scene)
    {
        let _texture = new Image();
        _texture.src = "source/tireless/resources/textures/Shared/tirelessBlock.png";

        let _sprite = new Sprite(_texture, Engine.I.PARTICLE_DEFAULT_LAYER, undefined, new Vector2(32, 32));

        let _animationClip = new AnimationClip("BlockAnim", 0, 2, 0.25, false, true);

        super(scene, _sprite, 3, _animationClip, true, "BlockParticle", null);

        this.transform.scale = new Vector2(0.5, 0.5);
    }
}

export class BloodParticle extends Particle
{
    constructor(scene)
    {
        let _texture = new Image();
        _texture.src = "source/tireless/resources/textures/Shared/tirelessBloodSplatter.png";

        let _sprite = new Sprite(_texture, Engine.I.PARTICLE_DEFAULT_LAYER, undefined, new Vector2(16, 16));

        let _animationClip = new AnimationClip("BloodAnim", 0, 4, 0.05, false, true);

        super(scene, _sprite, 5, _animationClip, true, "BloodParticle", null);

        this.transform.scale = new Vector2(1.5, 1.5);
    }
}

export class DeathParticle extends Particle
{
    constructor(scene)
    {
        let _texture = new Image();
        _texture.src = "source/tireless/resources/textures/Shared/tirelessDeath.png";

        let _sprite = new Sprite(_texture, Engine.I.PARTICLE_DEFAULT_LAYER, undefined, new Vector2(16, 16));

        let _animationClip = new AnimationClip("DeathAnim", 0, 4, 0.1, false, true);

        super(scene, _sprite, 5, _animationClip, true, "DeathParticle", null);

        this.transform.scale = new Vector2(1.5, 1.5);
    }
}

export class HealParticle extends Particle
{
    constructor(scene)
    {
        let _texture = new Image();
        _texture.src = "source/tireless/resources/textures/Shared/tirelessHeal.png";

        let _sprite = new Sprite(_texture, Engine.I.PARTICLE_DEFAULT_LAYER, undefined, new Vector2(16, 16));

        let _animationClip = new AnimationClip("HealAnim", 0, 2, 0.25, false, true);

        super(scene, _sprite, 3, _animationClip, true, "HealParticle", null);

        this.transform.scale = new Vector2(1.5, 1.5);
    }
}

export class EnemyStunParticle extends Particle
{
    constructor(scene)
    {
        let _texture = new Image();
        _texture.src = "source/tireless/resources/textures/Shared/tirelessStunned.png";

        let _sprite = new Sprite(_texture, Engine.I.PARTICLE_DEFAULT_LAYER, undefined, new Vector2(16, 16));

        let _animationClip = new AnimationClip("StunnedAnim", 0, 2, 0.1, false, true);

        super(scene, _sprite, 3, _animationClip, true, "StunnedParticle", null);

        this.transform.scale = new Vector2(1.5, 1.5);
    }
}