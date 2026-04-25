import 
{
    GameObject,
    Scene,
    SpriteRenderer,
    TilemapRenderer,
    Sprite,
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
    constructor(gameObject, dimensions)
    {
        super(gameObject, dimensions);
    }
}

export class HealthBoxCollider extends InteractableCollider
{
    constructor(gameObject, dimensions=new Vector2(16, 16))
    {
        super(gameObject, dimensions);
    }

    OnCollisionDetected(_other)
    {
        if (_other instanceof PlayerCollider)
        {
            if (this.gameObject.scene.player.controller.isFullHealth) { return; }

            this.gameObject.scene.player.controller.Heal(25);

            this.gameObject.Base_Destroy();
        }
    }
}

export class HealthBox extends GameObject
{
    constructor(scene, name="HealthBox", parent=null)
    {
        super(scene, name, parent);

        this.texture = new Image();
        this.texture.src = "source/tireless/resources/textures/Shared/tirelessHealthBox.png";

        this.renderer = this.AddComponent(SpriteRenderer, new Sprite(this.texture, undefined, undefined, new Vector2(16, 16)));

        this.collider = this.AddComponent(HealthBoxCollider);
    }
}