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

// Base class for entities that can be killed

export class LivingEntity extends Component
{
    constructor(gameObject, health=100)
    {
        super(gameObject);

        this._maxHealth = health;
        
        this._health = this._maxHealth;
    }

    Base_OnEntityKilled()
    {
        this.OnEntityKilled();
    }

    OnEntityKilled()
    {
        
    }

    Base_OnDamageTaken()
    {
        this.OnDamageTaken();
    }

    OnDamageTaken()
    {
        
    }

    Base_OnHealthSet(_value)
    {
        this.OnHealthSet(_value);
    }

    OnHealthSet(_value)
    {

    }

    // Health is clamped between 0-maxHealth

    Base_OnHealthChanged(_amount)
    {
        this._health = Math.min(Math.max(this._health, 0), this._maxHealth);

        if (this._health <= 0)
        {
            this.Base_OnEntityKilled();
        }

        this.OnHealthChanged(_amount);
    }

    OnHealthChanged(_amount)
    {
        
    }

    Damage(_amount)
    {
        this._health -= _amount;

        this.OnDamageTaken();

        this.Base_OnHealthChanged(-_amount);
    }

    Heal(_amount)
    {
        this._health += _amount;

        this.Base_OnHealthChanged(_amount);
    }

    set health(_value)
    {
        this._health = _value;

        this.Base_OnHealthSet(_value);
    }

    get health()
    {
        return this._health;
    }

    set maxHealth(_value)
    {
        this._maxHealth = _value;
    }

    get maxHealth()
    {
        return this._maxHealth;
    }

    get isFullHealth()
    {
        return this.health >= this.maxHealth;
    }
}