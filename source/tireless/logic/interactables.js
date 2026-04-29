import 
{
    GameObject,
    Scene,
    SpriteRenderer,
    TilemapRenderer,
    TextRenderer,
    TextData,
    Sprite,
    AnimationClip,
    Animator,
    AABB,
    Vector2,
    Engine
} from "/source/engine/rebound.js";

import
{
    PlayerCollider
} from "/source/tireless/logic/player.js";

import
{
    WorldCollider,
    PlayerOnlyCollider
} from "/source/tireless/tireless.js";

export class InteractableCollider extends AABB
{
    constructor(gameObject, dimensions, onInteractableUsed=() => {  })
    {
        super(gameObject, dimensions);

        this.onInteractableUsed = onInteractableUsed;
    }
}

export class ShopItemCollider extends InteractableCollider
{
    constructor(gameObject, dimensions, value, onInteractableUsed=() => {  })
    {
        super(gameObject, dimensions, onInteractableUsed);

        this.textRenderer = new GameObject(this.gameObject.scene, "ItemValueRenderer", this.gameObject.transform).AddComponent(TextRenderer, new TextData("COST: " + value, "8px VCR_OSD_MONO", "yellow", undefined, undefined, Engine.I.UI_TEXT_DEFAULT_LAYER));
        this.textRenderer.gameObject.transform.localPosition = new Vector2(0, 32);

        this.value = value;
    }

    OnCollisionDetected(_other)
    {
        if (_other instanceof PlayerCollider)
        {
            if (Engine.I.persistentScene.transferProperties.score >= this.value)
            {
                Engine.I.persistentScene.transferProperties.score -= this.value;

                this.gameObject.scene.player.controller.healSFX.Play();

                this.gameObject.Base_Destroy();

                this.onInteractableUsed();
            }
        }
    }
}

export class ShopGun extends GameObject
{
    constructor(scene, name="ShopGun", parent=null)
    {
        super(scene, name, parent);

        this.texture = new Image();
        this.texture.src = "source/tireless/resources/textures/Shared/tirelessGun.png";

        this.gunAnim = new AnimationClip("GunAnim", 0, 4, 0.1, true, true);

        this.renderer = this.AddComponent(SpriteRenderer, new Sprite(this.texture, undefined, undefined, new Vector2(24, 16)));
        this.animator = this.AddComponent(Animator, this.renderer, 5, [this.gunAnim]);

        this.collider = this.AddComponent(ShopItemCollider, new Vector2(24, 16), 100, () => { Engine.I.persistentScene.transferProperties.playerHasGun = true; });
    }
}

export class ShopKey extends GameObject
{
    constructor(scene, name="ShopKey", parent=null)
    {
        super(scene, name, parent);

        this.texture = new Image();
        this.texture.src = "source/tireless/resources/textures/Shared/tirelessKey.png";

        this.renderer = this.AddComponent(SpriteRenderer, new Sprite(this.texture, undefined, undefined, new Vector2(16, 16)));

        this.collider = this.AddComponent(ShopItemCollider, new Vector2(24, 16), 650, () => { Engine.I.persistentScene.transferProperties.keys[0] = true; });
    }
}

export class HealthBoxCollider extends InteractableCollider
{
    constructor(gameObject, dimensions=new Vector2(16, 16), onInteractableUsed=() => {  })
    {
        super(gameObject, dimensions, onInteractableUsed);
    }

    OnCollisionDetected(_other)
    {
        if (_other instanceof PlayerCollider)
        {
            if (this.gameObject.scene.player.controller.isFullHealth) { return; }

            this.gameObject.scene.player.controller.Heal(25);

            this.gameObject.Base_Destroy();

            this.onInteractableUsed();
        }
    }
}

export class HealthBox extends GameObject
{
    constructor(scene, onInteractableUsed, name="HealthBox", parent=null)
    {
        super(scene, name, parent);

        this.texture = new Image();
        this.texture.src = "source/tireless/resources/textures/Shared/tirelessHealthBox.png";

        this.renderer = this.AddComponent(SpriteRenderer, new Sprite(this.texture, undefined, undefined, new Vector2(16, 16)));

        this.collider = this.AddComponent(HealthBoxCollider, undefined, onInteractableUsed);
    }
}

export class KeyCollider extends InteractableCollider
{
    constructor(gameObject, dimensions, id, onInteractableUsed=() => {  })
    {
        super(gameObject, dimensions, onInteractableUsed);

        this.id = id;
    }

    OnCollisionDetected(_other)
    {
        if (_other instanceof PlayerCollider)
        {
            Engine.I.persistentScene.transferProperties.keys[this.id] = true;

            this.gameObject.Base_Destroy();

            this.onInteractableUsed();
        }
    }
}

export class Key extends GameObject
{
    constructor(scene, id, onInteractableUsed=() => {  }, name="Key", parent=null)
    {
        super(scene, name, parent);

        this.texture = new Image();
        this.texture.src = "source/tireless/resources/textures/Shared/tirelessKey.png";

        this.renderer = this.AddComponent(SpriteRenderer, new Sprite(this.texture, undefined, undefined, new Vector2(16, 16)));

        this.collider = this.AddComponent(KeyCollider, new Vector2(16, 16), id, onInteractableUsed);
    }
}

export class LevelSwapperCollider extends InteractableCollider
{
    constructor(gameObject, dimensions, swapOperation)
    {
        super(gameObject, dimensions);

        this.swapOperation = swapOperation;
    }

    OnCollisionDetected(_other)
    {
        if (_other instanceof PlayerCollider)
        {
            if (this.gameObject.unlockedObject.renderer.enabled)
            {
                this.swapOperation();

                this.Base_Destroy();
            }
        }
    }
}

export class LevelSwapper extends GameObject
{
    constructor(scene, dimensions, swapOperation, name="LevelSwapper", parent=null)
    {
        super(scene, name, parent);

        this.lockedTexture = new Image();
        this.lockedTexture.src = "source/tireless/resources/textures/Shared/tirelessLevelLocked.png";

        this.unlockedTexture = new Image();
        this.unlockedTexture.src = "source/tireless/resources/textures/Shared/tirelessLevelUnlocked.png";

        this.lockedAnim = new AnimationClip("LockedAnim", 0, 6, 0.1, true, true);
        this.unlockedAnim = new AnimationClip("UnlockedAnim", 0, 4, 0.1, true, true);

        this.renderer = this.AddComponent(SpriteRenderer, new Sprite(this.lockedTexture, undefined, undefined, new Vector2(16, 16)));
        this.animator = this.AddComponent(Animator, this.renderer, 7, [this.lockedAnim]);

        this.unlockedObject = new GameObject(this.scene, "UnlockedObject", this.transform);

        this.unlockedObject.renderer = this.unlockedObject.AddComponent(SpriteRenderer, new Sprite(this.unlockedTexture, undefined, undefined, new Vector2(16, 20)));
        this.unlockedObject.animator = this.unlockedObject.AddComponent(Animator, this.unlockedObject.renderer, 5, [this.unlockedAnim]);

        this.unlockedObject.renderer.enabled = false;

        this.collider = this.AddComponent(LevelSwapperCollider, dimensions, swapOperation);
    }
}