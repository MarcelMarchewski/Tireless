import 
{
    Component,
    GameObject,
    SpriteRenderer,
    Sprite,
    Animator,
    AnimationClip,
    AABB,
    Vector2,
    Engine
} from "/source/engine/rebound.js";

export class EnemyCollider extends AABB
{
    constructor(gameObject, dimensions)
    {
        super(gameObject, dimensions);


    }

    OnCollisionDetected(_other)
    {
        
    }
}