"use strict";

// NOTE: WHEN RENDERING SUB Y AXIS FROM CANVAS HEIGHT FOR INTUITIVE Y AXIS
export class Vector2
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

export class Transform
{
    constructor(gameObject, localPosition=Vector2.zero, localRotation=0, localScale=Vector2.one)
    {
        this.gameObject = gameObject;

        this.localPosition = localPosition;
        this.localRotation = localRotation;
        this.localScale = localScale;

        this._parent = null;

        this._children = [];

        this._initialising = true;
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

        if (!this._initialising && this._parent != null)
        {
            this.position = Vector2.Divide(Vector2.Rotate(Vector2.Subtract(_worldPosition, this._parent.position), -this._parent.rotation), this._parent.scale);
            this.rotation = _worldRotation - this._parent.rotation;
            this.scale = Vector2.Divide(_worldScale, this._parent.scale);
        }

        this._initialising = false;
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

    get lossyScale()
    {
        if (this.parent != null)
        {
            return Vector2.Multiply(this.parent.lossyScale, this.localScale);
        }

        else
        {
            return this.localScale;
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

export class Entity
{
    constructor()
    {
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

export class GameObject extends Entity
{
    constructor(scene, name="GameObject", parent=null)
    {
        super();

        this.scene = scene;

        this.name = name;
        
        this.transform = new Transform(this);
        
        if (parent == null && this.scene.root == undefined)
        {
            this.transform.parent = null;
        }

        else if (parent != null)
        {
            this.transform.parent = parent;
        }

        else
        {
            this.transform.parent = this.scene.root.transform;
        }

        this._components = [];
    }

    AddComponent(_componentType, ...args)
    {
        const _comp = new _componentType(this, ...args);

        this._components.push(_comp);

        _comp.Base_Start();

        return _comp;
    }

    RemoveComponent(_componentType)
    {
        const _compIndex = this._components.findIndex((_comp) => _comp instanceof _componentType);

        if (_compIndex == -1) { return; }

        const _comp = this._components[_compIndex];

        this._components.splice(_compIndex, 1);

        _comp.Base_OnRemove();
    }

    RemoveComponents(_componentType)
    {
        const _comps = this.GetComponents(_componentType);

        for (let i = 0; i < _comps.length; i++)
        {
            const _index = this._components.indexOf(_comps[i]);

            if (_index != -1)
            {
                this._components.splice(_index, 1);
                _comps[i].Base_OnRemove();
            }
        }
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

export class Component extends Entity
{
    constructor(gameObject)
    {
        super();

        this.gameObject = gameObject;

        this._hasStarted = false;
    }

    Base_Start()
    {
        if (this.enabled && this.gameObject.enabled && this.gameObject.parentEnabled && !this._hasStarted)
        {
            this.Start();

            this._hasStarted = true;
        }
    }

    Base_Update()
    {
        if (this.enabled && this.gameObject.enabled && this.gameObject.parentEnabled)
        {
            this.Update();
        }
    }

    Base_OnRemove()
    {
        this.OnRemove();
    }

    Start() {  }

    Update() {  }

    OnRemove() {  }
}

export class CursorManager extends Component
{
    constructor(gameObject)
    {
        super(gameObject);

        this._cursorPosition = Vector2.zero;

        this.Internal_SetCursorPosition = this.Internal_SetCursorPosition.bind(this);
    }

    Internal_SetCursorPosition(_event)
    {
        this._cursorPosition = new Vector2(Math.round(_event.clientX - (window.innerWidth / 2 - Engine.I.width / 2)), Engine.I.height - Math.round(_event.clientY - (window.innerHeight / 2 - Engine.I.height / 2)));
    }

    Start()
    {
        Engine.I.c.addEventListener('mousemove', this.Internal_SetCursorPosition);
    }

    OnEnable()
    {
        Engine.I.c.addEventListener('mousemove', this.Internal_SetCursorPosition);
    }

    OnDisable()
    {
        Engine.I.c.removeEventListener('mousemove', this.Internal_SetCursorPosition);
    }

    OnRemove()
    {
        Engine.I.c.removeEventListener('mousemove', this.Internal_SetCursorPosition);
    }

    get cursorPosition()
    {
        return this._cursorPosition;
    }
}

export class CursorBoxCollider extends Component
{
    constructor(gameObject, width=128, height=128, tracker=null)
    {
        super(gameObject);

        this.width = width;
        this.height = height;

        if (tracker == null)
        {
            this._tracker = gameObject.AddComponent(CursorTracker);
        }

        else
        {
            this._tracker = tracker;
        }

        this._isColliding = false;
    }

    Base_OnCursorCollideStart()
    {
        this.OnCursorCollideStart();
    }

    Base_OnCursorCollideUpdate()
    {
        this.OnCursorCollideUpdate();
    }

    Base_OnCursorCollideEnd()
    {
        this.OnCursorCollideEnd();
    }

    Update()
    {
        const _cursorPos = this._tracker.cursorPosition;

        // possibly refactor to use scale only
        if (_cursorPos.x >= this.gameObject.transform.position.x - this.width * this.gameObject.transform.scale.x 
        && _cursorPos.x <= this.gameObject.transform.position.x + this.width * this.gameObject.transform.scale.x
        && _cursorPos.y >= this.gameObject.transform.position.y - this.height * this.gameObject.transform.scale.y
        && _cursorPos.y <= this.gameObject.transform.position.y + this.height * this.gameObject.transform.scale.y
        )
        {
            if (this._isColliding)
            {
                this.Base_OnCursorCollideUpdate();
            }

            else
            {
                this._isColliding = true;

                this.Base_OnCursorCollideStart();
            }
        }

        else if (this._isColliding)
        {
            this._isColliding = false;

            this.Base_OnCursorCollideEnd();
        }
    }

    OnCursorCollideStart() {  }

    OnCursorCollideUpdate() {  }

    OnCursorCollideEnd() {  }
}

export class Sprite
{
    constructor(texture, layer=0, sourcePosition=null, sourceDimensions=null)
    {
        this.texture = texture;

        this.layer = layer;

        this.sourcePosition = sourcePosition;
        
        this.sourceDimensions = sourceDimensions;
    }

    get sourcePosition()
    {
        return this._sourcePosition;
    }

    set sourcePosition(_value)
    {
        if (_value != null)
        {
            this._sourcePosition = _value;
        }

        else
        {
            this._sourcePosition = Vector2.zero;
        }
    }

    get sourceDimensions()
    {
        return this._sourceDimensions;
    }

    set sourceDimensions(_value)
    {
        if (_value != null)
        {
            this._sourceDimensions = _value;
        }

        else
        {
            this._sourceDimensions = new Vector2(this.texture.width, this.texture.height);
        }
    }
}

export class SpriteRenderer extends Component
{
    constructor(gameObject, sprite=null)
    {
        super(gameObject);
        
        this.sprite = sprite;

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

    get sprite()
    {
        return this._sprite;
    }

    set sprite(_value)
    {
        if (_value != null)
        {
            this._sprite = _value;
        }

        else
        {
            this._sprite = new Sprite(Engine.I.missingTexture);
        }
    }
}

export class AudioPlayer extends Component
{
    constructor(gameObject, file, doAutoCatchup=false)
    {
        super(gameObject);

        this._audio = new Audio(file);

        this._doAutoCatchup = doAutoCatchup;
    }

    get audio()
    {
        return this._audio;
    }

    Play()
    {
        if (this._audio.readyState != 4)
        {
            this._audio.autoplay = this._doAutoCatchup;

            return;
        }

        this._audio.autoplay = false;
        this._audio.play();
    }

    Pause()
    {
        this._audio.pause();
    }

    Stop()
    {
        this.Pause();
        this._audio.currentTime = 0;
    }
}

export class Animator extends Component
{
    constructor(gameObject, spriteRenderer, frameCount, frameDuration=0.1)
    {
        super(gameObject);

        this.spriteRenderer = spriteRenderer;

        this.frameCount = frameCount;
        this.frameDuration = frameDuration;

        this._currentFrame = 0;
        this._timer = 0;
        
        this.loop = true;

        this.SetTexture(this.spriteRenderer.sprite.texture, this.frameCount);
    }

    Update()
    {
        if (this._frames.length == 0) { return; }

        this._timer += Engine.I.deltaTime;

        while (this._timer >= this.frameDuration)
        {
            this._timer -= this.frameDuration;
            this._currentFrame++;

            if (this._currentFrame >= this._frames.length)
            {
                if (this.loop)
                {
                    this._currentFrame = 0;
                }

                else
                {
                    this._currentFrame = this._frames.length - 1;
                }
            }

            this.spriteRenderer.sprite.sourcePosition = this._frames[this._currentFrame];
        }
    }

    SetTexture(_texture, _frameCount=this.frameCount)
    {
        this.spriteRenderer.sprite.texture = _texture;
        this.frameCount = _frameCount;

        this._frames = [];

        let x = 0;
        let y = 0;

        for (let i = 0; i < this.frameCount; i++)
        {
            this._frames.push(new Vector2(x, y));

            if (x < this.spriteRenderer.sprite.texture.width - this.spriteRenderer.sprite.sourceDimensions.x)
            {
                x += this.spriteRenderer.sprite.sourceDimensions.x + Engine.I.SPRITE_PADDING;
            }

            else
            {
                x = 0;

                y += this.spriteRenderer.sprite.sourceDimensions.y + Engine.I.SPRITE_PADDING;
            }
        }
    }
}

export class TilemapRenderer extends SpriteRenderer
{
    constructor(gameObject, sprite=null, dataPath=null)
    {
        super(gameObject, sprite);

        this.dataPath = dataPath;
    }

    GetData()
    {
        let _xmlHTTP = new XMLHttpRequest();;

        _xmlHTTP.onreadystatechange = function()
        {   
            if (_xmlHTTP.readyState == 4 && _xmlHTTP.status == 200)
            {
                return JSON.parse(_xmlHTTP.responseText);
            }
        }

        _xmlHTTP.open("GET", this._dataPath, false);
        _xmlHTTP.send();

        return JSON.parse(_xmlHTTP.response);
    }

    GenerateTiles()
    {
        let _tmp = [];

        this._col = Math.floor((this.sprite.texture.width + Engine.I.SPRITE_PADDING) / (this.sprite.sourceDimensions.x + Engine.I.SPRITE_PADDING));
        this._row = Math.floor((this.sprite.texture.height + Engine.I.SPRITE_PADDING) / (this.sprite.sourceDimensions.y + Engine.I.SPRITE_PADDING));

        for (let y = 0; y < this._row; y++)
        {
            const _yPos = y * (this.sprite.sourceDimensions.y + Engine.I.SPRITE_PADDING);

            for (let x = 0; x < this._col; x++)
            {
                const _xPos = x * (this.sprite.sourceDimensions.x + Engine.I.SPRITE_PADDING);

                _tmp.push(new Vector2(_xPos, _yPos));
            }
        }

        return _tmp;
    }

    get data()
    {
        return this._data;
    }

    get tiles()
    {
        return this._tiles;
    }

    set dataPath(_value)
    {
        if (_value != null)
        {
            this._dataPath = _value;
        }

        else
        {
            this._dataPath = "source/engine/tilemaps/missingTilemap.json"
        }

        this._data = this.GetData();
        this._tiles = this.GenerateTiles();
    }
    
    get sprite()
    {
        return this._sprite;
    }

    set sprite(_value)
    {
        if (_value != null)
        {
            this._sprite = _value;
        }

        else
        {
            this._sprite = new Sprite(Engine.I.missingTilemap);
        }
    }
}

export class TextData
{
    constructor(gameObject, text="Text here...", font="12px serif", layer=0)
    {
        this.gameObject = gameObject;

        this.text = text;
        this.font = font;

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
}

export class KeyboardInputManager extends Component
{
    constructor(gameObject)
    {
        super(gameObject);

        this.OnKeyDown = this.OnKeyDown.bind(this);
        this.OnKeyUp = this.OnKeyUp.bind(this);

        this._kdListeners = [];
        this._kuListeners = [];

        this._bound = false;
    }

    Start()
    {
        if (!this._bound)
        {
            document.addEventListener("keydown", this.OnKeyDown);
            document.addEventListener("keyup", this.OnKeyUp);

            this._bound = true;
        }
    }

    OnEnable()
    {
        if (!this._bound)
        {
            document.addEventListener("keydown", this.OnKeyDown);
            document.addEventListener("keyup", this.OnKeyUp);

            this._bound = true;
        }
    }

    OnDisable()
    {
        if (this._bound)
        {
            document.removeEventListener("keydown", this.OnKeyDown);
            document.removeEventListener("keyup", this.OnKeyUp);

            this._bound = false;
        }
    }

    OnRemove()
    {
        if (this._bound)
        {
            document.removeEventListener("keydown", this.OnKeyDown);
            document.removeEventListener("keyup", this.OnKeyUp);

            this._bound = false;
        }
    }

    OnKeyDown(_event)
    {
        for (let i = 0; i < this._kdListeners.length; i++)
        {
            this._kdListeners[i](_event);
        }
    }

    OnKeyUp(_event)
    {
        for (let i = 0; i < this._kuListeners.length; i++)
        {
            this._kuListeners[i](_event);
        }
    }

    AddKeyDownListener(_listener)
    {
        this._kdListeners.push(_listener);
    }

    RemoveKeyDownListener(_listener)
    {
        const _kdListenerIndex = this._kdListeners.findIndex((_listener) => _listener instanceof _componentType);

        if (_kdListenerIndex == -1) { return; }

        this._kdListeners.splice(_kdListenerIndex, 1);
    }

    AddKeyUpListener(_listener)
    {
        this._kuListeners.push(_listener);
    }

    RemoveKeyUpListener(_listener)
    {
        const _kuListenerIndex = this._kuListeners.findIndex((_listener) => _listener instanceof _componentType);

        if (_kuListenerIndex == -1) { return; }

        this._kuListeners.splice(_kuListenerIndex, 1);
    }
}

export class Scene
{
    constructor()
    {
        this.root = new GameObject(this, "Scene Root", null);

        this._initialised = false;
    }

    Base_Start()
    {
        this.cursorManager = this.root.AddComponent(CursorManager);
        this.keyboardInputManager = this.root.AddComponent(KeyboardInputManager);

        this.Start();
    }

    Base_Update() { this.Update(); }

    Internal_TraverseAndUpdate(_target=this.root.transform)
    {
        if (!_target.gameObject.enabled || !_target.gameObject.parentEnabled)
        {
            return;
        }

        if (_target == this.root.transform)
        {
            if (!this._initialised)
            {
                this.Base_Start();

                this._initialised = true;
            }

            this.Base_Update();
        }

        for (let i = 0; i < _target.childCount; i++)
        {
            this.Internal_TraverseAndUpdate(_target.GetChild(i));
        }

        _target.gameObject.Base_Update();
    }

    Start() {  }

    Update() {  }
}

export class Engine
{
    constructor(width=512, height=512, scale=Vector2.one, imageSmoothing=false, borderStyle="1px solid #000000")
    {
        if (Engine.I)
        {
            throw new Error("Multiple Rebound instances detected! There can only be one.");
        }

        else
        {
            Engine.I = this;
        }

        this.scale = scale;

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

        this.SPRITE_PADDING = 1;

        this.missingTexture = new Image();
        this.missingTexture.src = "source/engine/textures/missingTextureA.png";

        this.missingTilemap = new Image();
        this.missingTilemap.src = "source/engine/textures/missingTilemap.png";

        this._deltaTime = 0;
        this._renderQueue = [];
        this._scenes = [];

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
    }

    Internal_Update()
    {
        for (let i = 0; i < this._scenes.length; i++)
        {
            this._scenes[i].Internal_TraverseAndUpdate();
        }

        this.Internal_Render();
    }

    Internal_Render()
    {
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);

        this.ctx.clearRect(0, 0, this.c.width, this.c.height);

        this.ctx.scale(this.scale.x, this.scale.y);

        for (let i = 0; i < this._renderQueue.length; i++)
        {
            if (this._renderQueue[i] instanceof TilemapRenderer)
            {
                const _renderer = this._renderQueue[i];

                if (!_renderer.sprite.texture.complete) { continue; }

                this.ctx.save();

                this.ctx.translate(_renderer.gameObject.transform.position.x, this.height - _renderer.gameObject.transform.position.y);

                this.ctx.rotate(-_renderer.gameObject.transform.rotation);

                this.ctx.scale(_renderer.gameObject.transform.lossyScale.x, _renderer.gameObject.transform.lossyScale.y);

                let _row = 1;

                let _currentRowCol = 0;
                let _maxCol = 0;

                for (let _data of _renderer.data)
                {
                    const _current = _data.split("x");

                    const _command = parseInt(_current[0]);
                    const _iterations = parseInt(_current[1]);

                    if (_command == -1)
                    {
                        _row += _iterations;
                        _maxCol = Math.max(_maxCol, _currentRowCol);
                        _currentRowCol = 0;
                    }

                    else
                    {
                        _currentRowCol += _iterations;
                    }
                }

                _maxCol = Math.max(_maxCol, _currentRowCol);

                const _startPos = new Vector2(-(_maxCol * _renderer.sprite.sourceDimensions.x) / 2, -(_row * _renderer.sprite.sourceDimensions.y) / 2);
                const _currentPos = Vector2.zero;

                for (let _data of _renderer.data)
                {
                    const _current = _data.split("x");

                    const _command = parseInt(_current[0]);
                    const _iterations = parseInt(_current[1]);

                    if (_command == -1)
                    {
                        _currentPos.y += _iterations;
                        _currentPos.x = 0;

                        continue;
                    }

                    if (_command == -2)
                    {
                        _currentPos.x += _iterations;

                        continue;
                    }

                    for (let i = 0; i < _iterations; i++)
                    {
                        const _drawPos = new Vector2(_startPos.x + _currentPos.x * _renderer.sprite.sourceDimensions.x, _startPos.y + _currentPos.y * _renderer.sprite.sourceDimensions.y);

                        this.ctx.drawImage(_renderer.sprite.texture, _renderer.tiles[_command].x, _renderer.tiles[_command].y, _renderer.sprite.sourceDimensions.x, _renderer.sprite.sourceDimensions.y, _drawPos.x, _drawPos.y, _renderer.sprite.sourceDimensions.x, _renderer.sprite.sourceDimensions.y);

                        _currentPos.x++;
                    }
                }

                this.ctx.restore();
            }

            else if (this._renderQueue[i] instanceof SpriteRenderer)
            {
                const _renderer = this._renderQueue[i];

                if (!_renderer.sprite.texture.complete) { continue; }

                this.ctx.save();

                this.ctx.translate(_renderer.gameObject.transform.position.x, this.height - _renderer.gameObject.transform.position.y);

                this.ctx.rotate(-_renderer.gameObject.transform.rotation);

                this.ctx.scale(_renderer.gameObject.transform.lossyScale.x, _renderer.gameObject.transform.lossyScale.y);

                this.ctx.drawImage(_renderer.sprite.texture, _renderer.sprite.sourcePosition.x, _renderer.sprite.sourcePosition.y, _renderer.sprite.sourceDimensions.x, _renderer.sprite.sourceDimensions.y, -_renderer.sprite.sourceDimensions.x / 2, -_renderer.sprite.sourceDimensions.y / 2, _renderer.sprite.sourceDimensions.x, _renderer.sprite.sourceDimensions.y);

                this.ctx.restore();
            }

            else
            {
                this.ctx.save();

                this.ctx.translate(this._renderQueue[i].gameObject.transform.position.x, this.height - this._renderQueue[i].gameObject.transform.position.y);

                this.ctx.rotate(-this._renderQueue[i].gameObject.transform.rotation);

                this.ctx.scale(this._renderQueue[i].gameObject.transform.lossyScale.x, this._renderQueue[i].gameObject.transform.lossyScale.y);

                this.ctx.font = this._renderQueue[i].font;

                this.ctx.fillText(this._renderQueue[i].text, 0, 0);

                this.ctx.restore();
            }
        }
    }

    set width(_newWidth)
    {
        this._width = _newWidth;
        this.c.width = _newWidth * this.scale.x;
    }

    get width()
    {
        return this._width;
    }

    set height(_newHeight)
    {
        this._height = _newHeight;
        this.c.height = _newHeight * this.scale.y;
    }

    get height()
    {
        return this._height;
    }

    get deltaTime()
    {
        return this._deltaTime;
    }

    AddToRenderQueue(_renderer)
    {
        this._renderQueue.push(_renderer);

        this._renderQueue.sort((_a, _b) => { return _a.sprite.layer - _b.sprite.layer });
    }

    RemoveFromRenderQueue(_targetRenderer)
    {
        const _index = this._renderQueue.findIndex((_renderer) => _renderer === _targetRenderer)

        if (_index != -1)
        {
            this._renderQueue.splice(_index, 1);
        }
    }

    AddToScenes(_scene)
    {
        this._scenes.push(_scene);
    }

    RemoveFromScenes(_targetScene)
    {
        const _index = this._scenes.findIndex((_scene) => _scene === _targetScene)

        if (_index != -1)
        {
            this._scenes.splice(_index, 1);
        }
    }
}