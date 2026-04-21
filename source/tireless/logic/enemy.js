import 
{
    Component,
    GameObject,
    SpriteRenderer,
    Sprite,
    Animator,
    AnimationClip,
    AABB,
    Timer,
    Vector2,
    Engine
} from "/source/engine/rebound.js";

import 
{
    LivingEntity
} from "/source/tireless/logic/livingEntity.js";

export class EnemyCollider extends AABB
{
    constructor(gameObject, dimensions)
    {
        super(gameObject, dimensions);

        this.epsilon = 1;
    }

    Update()
    {
        this.gameObject.scene.colliderManager.Compare(this);
    }

    OnCollisionDetected(_other)
    {
        const _delta = new Vector2(
            _other.gameObject.transform.position.x - this.gameObject.transform.position.x,
            _other.gameObject.transform.position.y - this.gameObject.transform.position.y
        )

        const _penDepth = new Vector2(
            (this.dimensions.x / 2 + _other.dimensions.x / 2) - Math.abs(_delta.x), 
            (this.dimensions.y / 2 + _other.dimensions.y / 2) - Math.abs(_delta.y)
        );

        if (_penDepth.x < _penDepth.y)
        {
            this.gameObject.transform.localPosition.x -= (_penDepth.x + this.epsilon) * Math.sign(_delta.x);
        }

        else
        {
            this.gameObject.transform.localPosition.y -= (_penDepth.y + this.epsilon) * Math.sign(_delta.y);
        }
    }
}

export class EnemyDashTimer extends Timer
{
    constructor(gameObject, startValue=1, autoPlay=false, destructive=false)
    {
        super(gameObject, startValue, autoPlay, destructive);
    }

    OnTimerUp()
    {
        if (this.enemy == undefined)
        {
            this.enemy = this.gameObject.GetComponent(EnemyController);
        }

        if (!this.enemy.dashing) { this.enemy.dashing = true; }

        else
        {
            this.enemy.dashing = false;

            this.enemy.dashTarget = null;
        }
    }
}

export class EnemyController extends LivingEntity
{
    constructor(gameObject)
    {
        super(gameObject);

        this.player = this.gameObject.scene.player;

        this.dashTimer = this.gameObject.AddComponent(EnemyDashTimer);

        this.speed = 100;
        this.dashSpeed = 400;

        this.detectRange = 144;
        this.attackRange = 64;

        this.animator = this.gameObject.GetComponent(Animator);
        this.col = this.gameObject.GetComponent(EnemyCollider);

        this.moving = true;

        this.playerInRange = false;

        this.dashTarget = null;
        this.dashing = false;
    }

    Update()
    {
        if (this.dashTarget == null)
        {
            let _distanceToPlayer = Vector2.Distance(this.gameObject.transform.position, this.player.transform.position);

            if (_distanceToPlayer <= this.detectRange && _distanceToPlayer > this.attackRange)
            {
                const _direction = Vector2.Subtract(this.player.transform.position, this.gameObject.transform.position);

                const _move = Vector2.Multiply(_direction.normalised, new Vector2(Engine.I.deltaTime * this.speed, Engine.I.deltaTime * this.speed));

                this.gameObject.transform.localPosition.Add(_move);

                this.playerInRange = true;
            }

            else if (_distanceToPlayer <= this.detectRange)
            {
                this.dashTarget = this.player.transform.position;
                this.dashTimer.Play();

                this.playerInRange = true;
            }

            if (_distanceToPlayer > this.detectRange)
            {
                this.dashTimer.Pause();

                this.playerInRange = false;
            }
        }

        else
        {
            if (this.dashing)
            {
                let _distanceToTarget = Vector2.Distance(this.dashTarget, this.gameObject.transform.position);

                if (_distanceToTarget > 5)
                {
                    const _direction = Vector2.Subtract(this.dashTarget, this.gameObject.transform.position);

                    const _dash = Vector2.Multiply(_direction.normalised, new Vector2(Engine.I.deltaTime * this.dashSpeed, Engine.I.deltaTime * this.dashSpeed));

                    this.gameObject.transform.localPosition.Add(_dash);
                }

                if (!this.dashTimer._running)
                {
                    this.dashTimer.Play();
                }
            }
        }

        this.UpdateAnimator();
    }

    UpdateAnimator()
    {
        if (this.playerInRange && this.dashTarget == null)
        {
            let _x;
            let _y;

            const _direction = Vector2.Subtract(this.player.transform.position, this.gameObject.transform.position);

            _x = _direction.x;
            _y = _direction.y;

            const _degrees = Math.atan2(_y, _x) * 180 / Math.PI;

            let _frame = 0;
        
            if (_degrees >= -22.5 && _degrees < 22.5) { _frame = 2; }

            else if (_degrees >= 22.5 && _degrees < 67.5) { _frame = 1; }

            else if (_degrees >= 67.5 && _degrees < 112.5) { _frame = 0; }

            else if (_degrees >= 112.5 && _degrees < 157.5) { _frame = 7; }

            else if (_degrees >= 157.5 || _degrees < -157.5) { _frame = 6; }

            else if (_degrees >= -157.5 && _degrees < -112.5) { _frame = 5; }

            else if (_degrees >= -112.5 && _degrees < -67.5) { _frame = 4; }

            else if (_degrees >= -67.5 && _degrees < -22.5) { _frame = 3; }

            this.directionDegrees = _degrees;

            this.animator.JumpToFrame(_frame);
        }

        else if (this.dashTarget != null)
        {
            let _x;
            let _y;

            const _direction = Vector2.Subtract(this.dashTarget, this.gameObject.transform.position);

            _x = _direction.x;
            _y = _direction.y;

            const _degrees = Math.atan2(_y, _x) * 180 / Math.PI;

            let _frame = 0;
        
            if (_degrees >= -22.5 && _degrees < 22.5) { _frame = 2; }

            else if (_degrees >= 22.5 && _degrees < 67.5) { _frame = 1; }

            else if (_degrees >= 67.5 && _degrees < 112.5) { _frame = 0; }

            else if (_degrees >= 112.5 && _degrees < 157.5) { _frame = 7; }

            else if (_degrees >= 157.5 || _degrees < -157.5) { _frame = 6; }

            else if (_degrees >= -157.5 && _degrees < -112.5) { _frame = 5; }

            else if (_degrees >= -112.5 && _degrees < -67.5) { _frame = 4; }

            else if (_degrees >= -67.5 && _degrees < -22.5) { _frame = 3; }

            this.directionDegrees = _degrees;

            this.animator.JumpToFrame(_frame);
        }
    }
}

export class Enemy extends GameObject
{
    constructor(scene, name="Enemy", parent=null)
    {
        super(scene, name, parent);

        this.fixedAnimationClip = new AnimationClip("FixedAnim", 0, 8, 0, false, false);
        
        this.renderer = this.AddComponent(SpriteRenderer, new Sprite(this.scene.enemyTexture, undefined, undefined, new Vector2(32, 32)));
        this.animator = this.AddComponent(Animator, this.renderer, 8, [this.fixedAnimationClip]);
        
        this.col = this.AddComponent(EnemyCollider, new Vector2(32, 32));
        
        this.controller = this.AddComponent(EnemyController);
    }
}