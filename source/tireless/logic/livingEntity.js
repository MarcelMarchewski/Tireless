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

    OnHealthChanged()
    {
        this._health = Math.min(Math.max(this._health, 0), this._maxHealth);

        if (this._health <= 0)
        {
            this.Base_OnEntityKilled();
        }
    }

    Damage(_amount)
    {
        this._health -= _amount;

        this.OnDamageTaken();

        this.OnHealthChanged();
    }

    Heal(_amount)
    {
        this._health += _amount;

        this.OnHealthChanged();
    }

    set health(_value)
    {
        this._health = _value;

        this.OnHealthChanged();
    }

    get health()
    {
        return this._health;
    }

    set maxHealth(_value)
    {
        this._maxHealth = _value;

        this.OnHealthChanged();
    }

    get maxHealth()
    {
        return this._maxHealth;
    }
}