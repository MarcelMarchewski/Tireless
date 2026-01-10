"use strict";

// NOTE: WHEN RENDERING SUB Y AXIS FROM CANVAS HEIGHT FOR INTUITIVE Y AXIS
class Vector2
{
    constructor(x=0, y=0)
    {
        this.x = x;
        this.y = y;
    }

    get magnitude()
    {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    Add(_other)
    {
        this.x += _other.x;
        this.y += _other.y;
    }

    Subtract(_other)
    {
        this.x -= _other.x;
        this.y -= _other.y;
    }

    Multiply(_other)
    {
        this.x *= _other.x;
        this.y *= _other.y;
    }

    Divide(_other)
    {
        this.x /= _other.x;
        this.y /= _other.y;
    }

    static get negativeOne()
    {
        return new Vector2(-1, -1);
    }

    static get zero()
    {
        return new Vector2();
    }

    static get one()
    {
        return new Vector2(1, 1);
    }

    static get up()
    {
        return new Vector2(0, 1)
    }

    static get down()
    {
        return new Vector2(0, -1);
    }

    static get left()
    {
        return new Vector2(-1, 0);
    }

    static get right()
    {
        return new Vector2(1, 0);
    }

    static Add(_a, _b)
    {   
        return new Vector2(_a.x + _b.x, _a.y + _b.y);
    }

    static Subtract(_a, _b)
    {
        return new Vector2(_a.x - _b.x, _a.y - _b.y);
    }

    static Multiply(_a, _b)
    {   
        return new Vector2(_a.x * _b.x, _a.y * _b.y);
    }

    static Divide(_a, _b)
    {
        return new Vector2(_a.x / _b.x, _a.y / _b.y);
    }

    static Rotate(_target, _angle)
    {
        const _c = Math.cos(_angle);
        const _s = Math.sin(_angle);

        return new Vector2
        (
            _target.x * _c - _target.y * _s,
            _target.x * _s + _target.y * _c
        );
    }
}

class Transform
{
    constructor(gameObject, localPosition=Vector2.zero, localRotation=0, localScale=Vector2.one)
    {
        this.gameObject = gameObject;

        this.localPosition = localPosition;
        this.localRotation = localRotation;
        this.localScale = localScale;

        this._parent = null;

        this._children = [];
    }

    get parent()
    {
        return this._parent;
    }

    set parent(_newParent)
    {   
        if (this._parent != null)
        {
            this._parent.Internal_RemoveChild(this);
        }

        const _worldPosition = this.position;
        const _worldRotation = this.rotation;
        const _worldScale = this.scale;

        this._parent = _newParent;

        if (this._parent != null)
        {
            this._parent.Internal_AddChild(this);
        }

        this.position = _worldPosition;
        this.rotation = _worldRotation;
        this.scale = _worldScale;
    }

    get position()
    {
        if (this.parent != null)
        {
            const _scaledRotatedLocalPosition = Vector2.Rotate(Vector2.Multiply(this.localPosition, this.parent.scale), this.parent.rotation);

            return Vector2.Add(this.parent.position, _scaledRotatedLocalPosition);
        }

        else
        {
            return this.localPosition;
        }
    }

    set position(_newPosition)
    {
        if (this.parent != null)
        {
            let _a = Vector2.Subtract(_newPosition, this.parent.position);

            _a = Vector2.Rotate(_a, -this.parent.rotation);

            _a = Vector2.Divide(_a, this.parent.scale);

            this.localPosition = _a;
        }

        else
        {
            this.localPosition = _newPosition;
        }
    }

    get rotation()
    {
        if (this.parent != null)
        {
            return this.parent.rotation + this.localRotation;
        }

        else
        {
            return this.localRotation;
        }
    }

    set rotation(_newRotation)
    {
        if (this.parent != null)
        {
            this.localRotation = _newRotation - this.parent.rotation;
        }

        else
        {
            this.localRotation = _newRotation;
        }
    }

    get scale()
    {
        if (this.parent != null)
        {
            return Vector2.Multiply(this.parent.scale, this.localScale);
        }

        else
        {
            return this.localScale;
        }
    }

    set scale(_newScale)
    {
        if (this.parent != null)
        {
            this.localScale = Vector2.Divide(_newScale, this.parent.scale);
        }

        else
        {
            this.localScale = _newScale;
        }
    }

    get childCount()
    {
        return this._children.length;
    }

    GetChild(_index)
    {
        return this._children[_index] ?? null;
    }

    Internal_AddChild(_child)
    {
        this._children.push(_child);
    }

    Internal_RemoveChild(_targetChild)
    {
        const _index = this._children.findIndex((_child) => _child === _targetChild)

        if (_index != -1)
        {
            this._children.splice(_index, 1);
        }
    }
}

class Entity
{
    constructor()
    {
        this.hasStarted = false;

        this._enabled = true;
        this._parentEnabled = true;
    }

    OnEnable() {  }
    OnDisable() {  }

    get enabled()
    {
        return this._enabled;
    }

    set enabled(_value)
    {
        if (this._enabled != _value)
        {
            if (_value)
            {
                this.OnEnable();
            }

            else
            {
                this.OnDisable();
            }

            this._enabled = _value;
        }
    }

    get parentEnabled()
    {
        return this._parentEnabled;
    }

    set parentEnabled(_value)
    {
        this._parentEnabled = _value;
    }
}

class Component extends Entity
{
    constructor(gameObject)
    {
        super();

        this.gameObject = gameObject;
    }

    Base_Start()
    {
        if (this.enabled && this.gameObject.enabled && this.gameObject.parentEnabled && !this.hasStarted)
        {
            this.Start();

            this.hasStarted = true;
        }
    }

    Base_Update()
    {
        if (this.enabled && this.gameObject.enabled && this.gameObject.parentEnabled)
        {
            this.Update();
        }
    }

    Start() {  }

    Update() {  }
}

class SpriteRenderer extends Component
{
    constructor(gameObject, texture, layer=0)
    {
        super(gameObject);

        this.texture = texture;
        this.layer = layer;

        this._queued = false;
    }

    Enqueue()
    {
        if (!this._queued)
        {
            Engine.I.AddToRenderQueue(this);

            this._queued = true;
        }
    }

    Deque()
    {
        if (this._queued)
        {
            Engine.I.RemoveFromRenderQueue(this);

            this._queued = false;
        }
    }

    Start()
    {
        this.Enqueue();
    }

    OnEnable()
    {
        this.Enqueue();
    }

    OnDisable()
    {
        this.Deque();
    }
}

class TestComponent extends Component
{
    constructor(gameObject)
    {
        super(gameObject);
    }

    Start()
    {
        console.info("Test component started!");
    }

    Update()
    {
        console.info("Test component updated!");
    }

    OnEnable()
    {
        console.info("Test component enabled!");
    }

    OnDisable()
    {
        console.info("Test component disabled!");
    }
}

class GameObject extends Entity
{
    constructor(scene, name="GameObject", parent=null)
    {
        super();

        this.scene = scene;

        this.name = name;
        
        this.transform = new Transform(this);
        this.transform.parent = parent;

        this._components = [];
    }

    AddComponent(_componentType, ...args)
    {
        const _comp = new _componentType(this, ...args);

        this._components.push(_comp);

        _comp.Base_Start();
    }

    RemoveComponent(_componentType)
    {
        this._components.splice(this._components.findIndex((_comp) => _comp instanceof _componentType), 1);
    }

    GetComponent(_componentType)
    {
        return this._components.find((_comp) => _comp instanceof _componentType);
    }

    GetComponents(_componentType)
    {
        return this._components.filter((_comp) => _comp instanceof _componentType);
    }

    Base_Update()
    {
        if (this.enabled && this.parentEnabled)
        {
            for (let i = 0; i < this._components.length; i++)
            {
                this._components[i].Base_Update();
            }
        }
    }

    get enabled()
    {
        return this._enabled;
    }

    set enabled(_value)
    {
        if (this._enabled == _value) { return; }

        this._enabled = _value;

        this.Internal_TraverseAndSetEnableState();

        for (let i = 0; i < this.componentCount; i++)
        {
            _value ? this._components[i].OnEnable() : this._components[i].OnDisable();
        }
    }

    get componentCount()
    {
        return this._components.length;
    }

    Internal_TraverseAndSetEnableState(_target=this.transform)
    {
        const _parentGO = _target.parent?.gameObject;

        _target.gameObject.parentEnabled = _parentGO ? (_parentGO.enabled && _parentGO.parentEnabled) : true;

        for (let i = 0; i < _target.childCount; i++)
        {
            this.Internal_TraverseAndSetEnableState(_target.GetChild(i));
        }
    }
}

class Scene
{
    constructor()
    {
        this.root = new GameObject("Scene Root");
    }

    Internal_TraverseAndUpdate(_target=this.root.transform)
    {
        if (!_target.gameObject.enabled || !_target.gameObject.parentEnabled)
        {
            return;
        }

        for (let i = 0; i < _target.childCount; i++)
        {
            this.Internal_TraverseAndUpdate(_target.GetChild(i));
        }

        _target.gameObject.Base_Update();
    }
}

class Engine
{
    constructor(width=512, height=512, imageSmoothing=false, borderStyle="1px solid #000000")
    {
        if (Engine.I)
        {
            throw new Error("Multiple Rebound instances detected! There can only be one.");
        }

        else
        {
            Engine.I = this;
        }

        this.c = document.createElement("canvas");

        this.c.id = "reboundCanvas";

        this.width = width;
        this.height = height;

        this.c.style.position = "absolute";
        this.c.style.margin = "auto";
        this.c.style.display = "block";

        this.c.style.top = 0;
        this.c.style.bottom = 0;
        this.c.style.left = 0;
        this.c.style.right = 0;

        this.c.style.border = borderStyle;

        document.body.appendChild(this.c);

        this.ctx = this.c.getContext("2d");

        this.ctx.imageSmoothingEnabled = imageSmoothing;

        this._deltaTime = 0;
        this._renderQueue = [];

        this.Internal_Start();

        window.onEachFrame(this.Internal_Update.bind(this));
    }

    static I;

    Internal_Start()
    {
        let _lastTime = performance.now();

        const _frame = (callback) =>
        {
            const _callback = () =>
            {
                const _currentTime = performance.now();

                this._deltaTime = (_currentTime - _lastTime) / 1000;
                
                _lastTime = _currentTime;

                callback();

                requestAnimationFrame(_callback);
            }

            _callback();
        }

        window.onEachFrame = _frame;

        this.s = new Scene();

        const _go1 = new GameObject(this.s, "OBJ1", this.s.root.transform);
        const _go2 = new GameObject(this.s, "OBJ2", _go1.transform);

        this.missingTextureA = new Image();
        this.missingTextureA.src = "source/engine/textures/missingTextureA.png";

        _go1.AddComponent(SpriteRenderer, this.missingTextureA, 0);
        _go1.transform.localScale = new Vector2(50, 50);

        this.missingTextureB = new Image();
        this.missingTextureB.src = "source/engine/textures/missingTextureB.png";

        _go2.AddComponent(SpriteRenderer, this.missingTextureB, 1);
        _go2.transform.localScale = new Vector2(0.5, 0.5);
    }

    Internal_Update()
    {
        this.s.root.transform.GetChild(0).localPosition.Add(Vector2.one);

        this.s.Internal_TraverseAndUpdate();

        this.Internal_Render();
    }

    Internal_Render()
    {
        this.ctx.clearRect(0, 0, this.width, this.height);

        for (let i = 0; i < this._renderQueue.length; i++)
        {
            const _renderer = this._renderQueue[i];

            if (!_renderer.texture.complete) { continue; }

            this.ctx.save();

            this.ctx.translate(_renderer.gameObject.transform.position.x, this.height - _renderer.gameObject.transform.position.y);

            this.ctx.rotate(-_renderer.gameObject.transform.rotation);

            this.ctx.scale(_renderer.gameObject.transform.scale.x, _renderer.gameObject.transform.scale.y);

            this.ctx.drawImage(_renderer.texture, -_renderer.texture.width / 2, -_renderer.texture.height / 2);

            this.ctx.restore();
        }
    }

    set width(_newWidth)
    {
        this.c.width = _newWidth;
    }

    get width()
    {
        return this.c.width;
    }

    set height(_newHeight)
    {
        this.c.height = _newHeight;
    }

    get height()
    {
        return this.c.height;
    }

    get deltaTime()
    {
        return this._deltaTime;
    }

    AddToRenderQueue(_renderer)
    {
        this._renderQueue.push(_renderer);

        this._renderQueue.sort((_a, _b) => { return _a.layer - _b.layer });
    }

    RemoveFromRenderQueue(_targetRenderer)
    {
        const _index = this._renderQueue.findIndex((_renderer) => _renderer === _targetRenderer)

        if (_index != -1)
        {
            this._renderQueue.splice(_index, 1);
        }
    }
}

const _e = new Engine();