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

    get normalised()
    {
        if (this.magnitude == 0) { return Vector2.zero; }

        return new Vector2(this.x / this.magnitude, this.y / this.magnitude);
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

    Normalise()
    {
        if (this.magnitude == 0) { return; }

        this.x /= this.magnitude;
        this.y /= this.magnitude;
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
        const _rad = _angle * Math.PI / 180;

        const _c = Math.cos(_rad);
        const _s = Math.sin(_rad);

        return new Vector2
        (
            _target.x * _c - _target.y * _s,
            _target.x * _s + _target.y * _c
        );
    }

    static Dot(_a, _b)
    {
        return _a.x * _b.x + _a.y * _b.y;
    }

    static DegreeAngle(_a, _b)
    {
        return Math.atan2(_b.y - _a.y, _b.x - _a.x) * 180 / Math.PI;
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
    }

    get parent()
    {
        return this._parent;
    }

    set parent(_newParent)
    {   
        if (this._parent == _newParent) { return; }

        const _worldPosition = this.position;
        const _worldRotation = this.rotation;
        const _worldScale = this.scale;

        if (this._parent != null)
        {
            this._parent.Internal_RemoveChild(this);
        }

        this._parent = _newParent;

        if (this._parent != null)
        {
            this._parent.Internal_AddChild(this);
        }

        if (this.parent == null)
        {
            this.localPosition = _worldPosition;
            this.localRotation = _worldRotation;
            this.localScale = _worldScale;
        }

        else
        {
            this.position = _worldPosition;
            this.rotation = _worldRotation;
            this.scale = _worldScale;
        }
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

        this._destroyed = false;
    }

    Base_Destroy()
    {
        if (this._destroyed) { return; }

        this.Destroy();
        
        this._destroyed = true;
    }

    OnEnable() {  }
    OnDisable() {  }
    Destroy() {  }

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

    GetComponent(_componentType)
    {
        return this._components.find((_comp) => _comp instanceof _componentType);
    }

    GetComponents(_componentType)
    {
        return this._components.filter((_comp) => _comp instanceof _componentType);
    }

    Destroy()
    {
        for (let i = 0; i < this.transform.childCount; i++)
        {
            this.transform.GetChild(i).gameObject.Base_Destroy();
            i--;
        }

        for (let i = 0; i < this.componentCount; i++)
        {
            this._components[i].Base_Destroy();
            i--;
        }

        this.transform.parent = null;
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

        super.enabled = _value;

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

        const _newParentEnabled = _parentGO ? (_parentGO.enabled && _parentGO.parentEnabled) : true

        const _didChange = _target.gameObject.parentEnabled != _newParentEnabled;

        if (_didChange)
        {
            _target.gameObject.parentEnabled = _newParentEnabled;

            for (let i = 0; i < _target.gameObject.componentCount; i++)
            {
                _newParentEnabled ? _target.gameObject._components[i].OnEnable() : _target.gameObject._components[i].OnDisable();
            }
        }

        for (let i = 0; i < _target.childCount; i++)
        {
            this.Internal_TraverseAndSetEnableState(_target.GetChild(i));
        }
    }

    Internal_RemoveComponent(_targetComponent)
    {
        const _compIndex = this._components.indexOf(_targetComponent);

        if (_compIndex == -1) { return; }

        this._components.splice(_compIndex, 1);
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
        if (this.enabled && !this._hasStarted)
        {
            this.Start();

            this._hasStarted = true;
        }
    }

    Base_Update()
    {
        if (this.enabled)
        {
            this.Update();
        }
    }

    Destroy()
    {
        if (this._destroyed) { return; }

        this.gameObject.Internal_RemoveComponent(this);

        this.OnDestroy();
    }

    Start() {  }

    Update() {  }

    OnDestroy() {  }
}

export class CursorManager extends Component
{
    constructor(gameObject)
    {
        super(gameObject);

        this.Internal_SetCursorPosition = this.Internal_SetCursorPosition.bind(this);

        this._cPosListeners = [];

        this._cursorPosition = Vector2.zero;
    }

    Internal_SetCursorPosition(_event)
    {
        const _rect = Engine.I.c.getBoundingClientRect();

        const _x = Math.floor(_event.offsetX / Engine.I.scale.x);
        const _y = Math.floor(_event.offsetY / Engine.I.scale.y);

        this._cursorPosition = new Vector2(_x, Engine.I.height - _y);

        for (let i = 0; i < this._cPosListeners.length; i++)
        {
            this._cPosListeners[i](this._cursorPosition);
        }
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

    OnDestroy()
    {
        Engine.I.c.removeEventListener('mousemove', this.Internal_SetCursorPosition);
    }

    get cursorPosition()
    {
        return this._cursorPosition;
    }

    AddCursorPositionListener(_listener)
    {
        this._cPosListeners.push(_listener);
    }

    RemoveCursorPositionListener(_listener)
    {
        const _cPosListenerIndex = this._cPosListeners.indexOf(_listener);

        if (_cPosListenerIndex == -1) { return; }

        this._cPosListeners.splice(_cPosListenerIndex, 1);
    }
}

export class CursorBoxCollider extends Component
{
    constructor(gameObject, width=32, height=32)
    {
        super(gameObject);

        this.width = width;
        this.height = height;

        this.Base_OnClickStart = this.Base_OnClickStart.bind(this);
        this.Base_OnClickEnd = this.Base_OnClickEnd.bind(this);

        this._cursorManager = Engine.I.persistentScene.cursorManager;

        this._isColliding = false;
    }

    OnDisable()
    {
        this.Internal_RemoveListeners();
        this._isColliding = false;
    }

    OnDestroy()
    {
        this.Internal_RemoveListeners();
        this._isColliding = false;
    }

    Internal_AddListeners()
    {
        Engine.I.c.addEventListener("mousedown", this.Base_OnClickStart);
        Engine.I.c.addEventListener("mouseup", this.Base_OnClickEnd);
    }

    Internal_RemoveListeners()
    {
        Engine.I.c.removeEventListener("mousedown", this.Base_OnClickStart);
        Engine.I.c.removeEventListener("mouseup", this.Base_OnClickEnd);
    }

    Base_OnCursorCollideStart()
    {
        this.Internal_AddListeners();

        this.OnCursorCollideStart();
    }

    Base_OnCursorCollideUpdate()
    {
        this.OnCursorCollideUpdate();
    }

    Base_OnClickStart(_event)
    {
        this.OnClickStart(_event);
    }

    Base_OnClickEnd(_event)
    {
        this.OnClickEnd(_event);
    }

    Base_OnCursorCollideEnd()
    {
        this.Internal_RemoveListeners();

        this.OnCursorCollideEnd();
    }

    Update()
    {
        const _cursorPos = this._cursorManager.cursorPosition;

        if (_cursorPos.x >= this.gameObject.transform.position.x - this.width / 2 
        && _cursorPos.x <= this.gameObject.transform.position.x + this.width / 2
        && _cursorPos.y >= this.gameObject.transform.position.y - this.height / 2
        && _cursorPos.y <= this.gameObject.transform.position.y + this.height / 2
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

    OnClickStart(_event) {  }

    OnClickEnd(_event) {  }

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
            if (this.texture.complete)
            {
                this._sourceDimensions = new Vector2(this.texture.width, this.texture.height);
            }

            else
            {
                this._sourceDimensions = Vector2.zero;

                this.texture.onload = () => 
                {
                    this._sourceDimensions = new Vector2(this.texture.width, this.texture.height);
                }
            }
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

    OnDestroy()
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

export class TextRenderer extends Component
{
    constructor(gameObject, data=null)
    {
        super(gameObject);

        this._textData = data;
        
        this._queued = false;
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

    OnDestroy()
    {
        this.Deque();
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

    get textData()
    {
        return this._textData;
    }

    set textData(_value)
    {
        if (_value != null)
        {
            this._textData = _value;
        }

        else
        {
            this._textData = new TextData("", undefined, undefined, undefined, undefined, Engine.I.UI_TEXT_DEFAULT_LAYER);
        }
    }
}

export class AudioMixer
{
    constructor(name, volume=1, muted=false, parentMixer=null)
    {
        this.name = name;

        this._audioPlayers = [];
        this._childMixers = [];

        this.mutedInitial = muted;

        this.volumeInitial = volume;

        this._parentMixer = null;

        this.parentMixer = parentMixer;
    }

    get localVolumePure()
    {
        return this._volume;
    }

    get localVolume()
    {
        return this._volume * this._muteValue;
    }

    get volume()
    {
        if (this._parentMixer != null)
        {
            return this.localVolume * this._parentMixer.volume;
        }

        else
        {
            return this.localVolume;
        }
    }

    set volume(_value)
    {
        this._volume = _value;

        localStorage.setItem(this.name + "LocalVolumePure", this.localVolumePure);

        this.Internal_UpdateVolumes();
    }

    set volumeInitial(_value)
    {
        const _storedVolume = localStorage.getItem(this.name + "LocalVolumePure");

        if (_storedVolume == null)
        {
            this.volume = _value;
        }

        else
        {
            this.volume = Number(localStorage.getItem(this.name + "LocalVolumePure"));
        }
    }

    get muted()
    {
        return this._muteValue == 0;
    }

    set muted(_value)
    {
        if (_value)
        {
            this._muteValue = 0;
        }

        else
        {
            this._muteValue = 1;
        }

        localStorage.setItem(this.name + "Muted", this.muted);

        this.Internal_UpdateVolumes();
    }

    set mutedInitial(_value)
    {
        const _storedMuted = localStorage.getItem(this.name + "Muted");

        if (_storedMuted == null)
        {
            this.muted = _value;
        }

        else
        {
            this.muted = (localStorage.getItem(this.name + "Muted") == "true");
        }
    }

    get parentMixer()
    {
        return this._parentMixer;
    }

    set parentMixer(_newParentMixer)
    {
        if (this._parentMixer == _newParentMixer) { return; }

        if (this._parentMixer != null)
        {
            this._parentMixer.RemoveChild(this);
        }

        this._parentMixer = _newParentMixer;

        if (this._parentMixer != null)
        {
            this._parentMixer.AddChild(this);
        }

        this.Internal_UpdateVolumes();
    }

    Internal_UpdateVolumes()
    {
        for (let i = 0; i < this._audioPlayers.length; i++)
        {
            this._audioPlayers[i].Internal_SetVolume();
        }

        for (let i = 0; i < this._childMixers.length; i++)
        {
            this._childMixers[i].Internal_UpdateVolumes();
        }
    }

    AddChild(_child)
    {
        this._childMixers.push(_child);
    }

    RemoveChild(_child)
    {
        const _childIndex = this._childMixers.indexOf(_child);

        if (_childIndex == -1) { return; }

        this._childMixers.splice(_childIndex, 1);
    }

    AddAudioPlayer(_player)
    {
        this._audioPlayers.push(_player);
    }

    RemoveAudioPlayer(_player)
    {
        const _playerIndex = this._audioPlayers.indexOf(_player);

        if (_playerIndex == -1) { return; }

        this._audioPlayers.splice(_playerIndex, 1);
    }
}

export class AudioPlayer extends Component
{
    constructor(gameObject, file, mixer=null, volume=1, loop=false, doAutoCatchup=false)
    {
        super(gameObject);

        this._ctx = Engine.I.audioCtx;

        this._gain = this._ctx.createGain();
        this._gain.connect(this._ctx.destination);

        this.LoadAudio = this.LoadAudio.bind(this);

        this.onEnded = null;

        this._file = file;
        this._doAutoCatchup = doAutoCatchup;

        this._buffer = null;
        this._src = null;
        this._playing = false;

        this._disablePause = false;
        
        this._startTime = 0;
        this._pauseTime = 0;

        this._volume = volume;
        this._muteValue = 1;

        this.mixer = mixer;
        this.muted = false;
        this.volume = volume;
        this.loop = loop;
    }

    OnEnable()
    {
        if (this._disablePause)
        {
            this.Play();

            this._disablePause = false;
        }
    }

    OnDisable()
    {
        if (this._playing)
        {
            this.Pause();

            this._disablePause = true;
        }
    }

    OnDestroy()
    {
        if (this._playing)
        {
            this.Stop();
        }

        this.mixer.RemoveAudioPlayer(this);
    }

    async LoadAudio()
    {
        const _data = await fetch(this._file);
        const _arrayBuffer = await _data.arrayBuffer();

        this._buffer = await this._ctx.decodeAudioData(_arrayBuffer);
    }

    get volume()
    {
        return this._volume;
    }

    set volume(_value)
    {
        this._volume = _value;

        this.Internal_SetVolume();
    }

    get muted()
    {
        return this._muteValue == 0;
    }

    set muted(_value)
    {
        if (_value)
        {
            this._muteValue = 0;
        }

        else
        {
            this._muteValue = 1;
        }

        this.Internal_SetVolume();
    }

    get mixer()
    {
        return this._mixer;
    }

    set mixer(_newMixer)
    {
        if (_newMixer == null)
        {
            _newMixer = Engine.I.masterMixer;
        }

        if (this._mixer != null)
        {
            this._mixer.RemoveAudioPlayer(this);
        }

        this._mixer = _newMixer;

        this._mixer.AddAudioPlayer(this);

        this.Internal_SetVolume();
    }

    get playing()
    {
        return this._playing;
    }

    Internal_SetVolume()
    {
        this._gain.gain.value = this._volume * this._mixer.volume * this._muteValue;
    }

    Internal_CreateSource()
    {
        if (this._src != null)
        {
            try 
            {
                this._src.stop();
            }

            catch {  }
        }

        this._src = this._ctx.createBufferSource();

        this._src.buffer = this._buffer;
        this._src.loop = this.loop;

        this._src.connect(this._gain);

        this._src.onended = () =>
        {
            if (!this.loop)
            {
                this._playing = false;
                this._pauseTime = 0;
            }

            if (this.onEnded != null)
            {
                this.onEnded();
            }
        };
    }

    async Play()
    {
        if (!this._buffer)
        {
            await this.LoadAudio();
        }

        if (this._ctx.state == "suspended")
        {
            await this._ctx.resume();
        }

        this.Internal_SetVolume();

        if (this._playing) { return; }

        this.Internal_CreateSource();

        this._startTime = this._ctx.currentTime - this._pauseTime;

        this._src.start(0, this._pauseTime);
        this._playing = true;
    }

    Pause()
    {
        if (!this._playing || this._src == null) { return; }

        this._pauseTime = this._ctx.currentTime - this._startTime;

        try 
        {
            this._src.stop();
        }

        catch {  }

        this._src = null;
        this._playing = false;
    }

    Stop()
    {
        if (this._src != null)
        {
            try 
            {
                this._src.stop();
                this._src = null;
            }

            catch {  }
        }

        this._pauseTime = 0;
        this._playing = false;
    }

    SetFile(_newFile)
    {
        this._file = _newFile;
        this._buffer = null;
        
        this.Stop();
    }
}

export class Animator extends Component
{
    constructor(gameObject, spriteRenderer, frameCount, frameDuration=0.1, loop=true, autoplay=true)
    {
        super(gameObject);

        this.spriteRenderer = spriteRenderer;

        this.frameCount = frameCount;
        this.frameDuration = frameDuration;

        this._currentFrame = 0;
        this._timer = 0;
        this._playing = false;

        this._frames = [];
        
        this.loop = loop;
        this.autoplay = autoplay;

        this.SetTexture(this.spriteRenderer.sprite.texture, this.frameCount);
    }

    Start() 
    {
        if (this.autoplay)
        {
            this.Play();
        }
    }

    OnEnable()
    {
        this.SetTexture(this.spriteRenderer.sprite.texture, this.frameCount);
    }

    Update()
    {
        if (this._frames.length == 0 || !this._playing) { return; }

        this._timer += Engine.I.deltaTime;

        while (this._timer >= this.frameDuration)
        {
            this._timer -= this.frameDuration;
            
            this.NextFrame();
        }
    }

    Play()
    {
        this._timer = 0;
        
        this._playing = true;
    }

    Pause()
    {
        this._timer = 0;

        this._playing = false;
    }

    Stop()
    {
        this._timer = 0;
        this._currentFrame = 0;

        this._playing = false;

        this.Internal_RunFrame();
    }

    Internal_RunFrameWithLoopCheck()
    {
        if (this._frames.length == 0) { return; }

        if (this._currentFrame >= this._frames.length)
        {
            if (this.loop)
            {
                this._currentFrame = 0;
            }

            else
            {
                this._currentFrame = this._frames.length - 1;

                this.Pause();
            }
        }

        this.spriteRenderer.sprite.sourcePosition = this._frames[this._currentFrame];
    }

    Internal_RunFrame()
    {
        if (this._frames.length == 0) { return; }

        this.spriteRenderer.sprite.sourcePosition = this._frames[this._currentFrame];
    }

    NextFrame()
    {
        this._currentFrame++;

        this.Internal_RunFrameWithLoopCheck();
    }

    JumpToFrame(_frame)
    {
        this._currentFrame = _frame;

        if (this._frames.length == 0) { return; }

        this.Internal_RunFrameWithLoopCheck();
    }

    SetTexture(_texture, _frameCount=this.frameCount)
    {
        this.spriteRenderer.sprite.texture = _texture;
        this.frameCount = _frameCount;

        if (!_texture.complete)
        {
            _texture.addEventListener("load", () => { this.SetTexture(_texture, _frameCount); }, { once: true });
            return;
        }

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
        let _xmlHTTP = new XMLHttpRequest();

        _xmlHTTP.open("GET", this._dataPath, false);
        _xmlHTTP.send();

        return JSON.parse(_xmlHTTP.response);
    }

    Internal_GenerateTiles()
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

    Internal_TryGenerateTiles()
    {
        if (!this.sprite.texture.complete)
        {
            this.sprite.texture.addEventListener("load", () => { this._tiles = this.Internal_GenerateTiles(); }, { once: true });

            return;
        }

        this._tiles = this.Internal_GenerateTiles();
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
        
        this.Internal_TryGenerateTiles();
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

        if (this._data)
        {
            this.Internal_TryGenerateTiles();
        }
    }
}

export class TextData
{
    constructor(text="Text here...", font="12px serif", colour="black", alignment="center", baseline="middle", layer=Engine.I.UI_TEXT_DEFAULT_LAYER)
    {
        this.text = text;
        this.font = font;

        this.colour = colour;

        this.alignment = alignment;
        this.baseline = baseline;

        this.layer = layer;
    }
}

export class InputManager extends Component
{
    constructor(gameObject)
    {
        super(gameObject);

        this.inputMode = 0;

        this.OnCursorPositionUpdate = this.OnCursorPositionUpdate.bind(this);

        this.OnKeyDown = this.OnKeyDown.bind(this);
        this.OnKeyUp = this.OnKeyUp.bind(this);

        this.OnGamepadConnected = this.OnGamepadConnected.bind(this);
        this.OnGamepadDisconnected = this.OnGamepadDisconnected.bind(this);

        this.STICK_THRESHOLD = 0.01;

        this._kdListeners = [];
        this._kuListeners = [];

        this._bound = false;

        this._currentGamepadIndex = null;

        this._lastGamepadInputs = [];
        this._lastGamepadAxisValues = [];

        this._gpbdListeners = [];
        this._gpbuListeners = [];

        this._gplsListeners = [];
        this._gprsListeners = [];
    }

    Start()
    {
        if (!this._bound)
        {
            Engine.I.persistentScene.cursorManager.AddCursorPositionListener(this.OnCursorPositionUpdate);

            document.addEventListener("keydown", this.OnKeyDown);
            document.addEventListener("keyup", this.OnKeyUp);

            window.addEventListener("gamepadconnected", this.OnGamepadConnected);
            window.addEventListener("gamepaddisconnected", this.OnGamepadDisconnected);

            this._bound = true;
        }
    }

    Update()
    {
        if (this._currentGamepadIndex == null) { return; }
        
        const _gamepad = navigator.getGamepads()[this._currentGamepadIndex];

        if (_gamepad == null) { return; }

        for (let i = 0; i < _gamepad.buttons.length; i++)
        {
            const _currentState = _gamepad.buttons[i].pressed;
            const _lastState = this._lastGamepadInputs[i] || false;

            const _name = Engine.I.STANDARD_CONTROLLER_BUTTONS[i] || "Unknown Button " + i;

            if (_currentState && !_lastState)
            {
                this.OnGamepadButtonDown(_gamepad.buttons[i], _name);
            }

            else if (!_currentState && _lastState)
            {
                this.OnGamepadButtonUp(_gamepad.buttons[i], _name);
            }

            this._lastGamepadInputs[i] = _currentState;
        }

        for (let i = 0; i < _gamepad.axes.length; i += 2)
        {
            const _currentValueX = _gamepad.axes[i];
            const _currentValueY = _gamepad.axes[i + 1];

            const _lastValueX = this._lastGamepadAxisValues[i] || 0;
            const _lastValueY = this._lastGamepadAxisValues[i + 1] || 0;

            if (Math.abs(_currentValueX - _lastValueX) > this.STICK_THRESHOLD || Math.abs(_currentValueY - _lastValueY) > this.STICK_THRESHOLD)
            {
                if (i == 0)
                {
                    this.OnGamepadLeftStick(_currentValueX, _currentValueY);
                }

                else
                {
                    this.OnGamepadRightStick(_currentValueX, _currentValueY);
                }
            }

            this._lastGamepadAxisValues[i] = _currentValueX;
            this._lastGamepadAxisValues[i + 1] = _currentValueY;
        }
    }

    OnEnable()
    {
        if (!this._bound)
        {
            document.addEventListener("keydown", this.OnKeyDown);
            document.addEventListener("keyup", this.OnKeyUp);

            window.addEventListener("gamepadconnected", this.OnGamepadConnected);
            window.addEventListener("gamepaddisconnected", this.OnGamepadDisconnected);

            this._bound = true;
        }
    }

    OnDisable()
    {
        if (this._bound)
        {
            document.removeEventListener("keydown", this.OnKeyDown);
            document.removeEventListener("keyup", this.OnKeyUp);

            window.removeEventListener("gamepadconnected", this.OnGamepadConnected);
            window.removeEventListener("gamepaddisconnected", this.OnGamepadDisconnected);

            this._bound = false;
        }
    }

    OnDestroy()
    {
        if (this._bound)
        {
            document.removeEventListener("keydown", this.OnKeyDown);
            document.removeEventListener("keyup", this.OnKeyUp);

            window.removeEventListener("gamepadconnected", this.OnGamepadConnected);
            window.removeEventListener("gamepaddisconnected", this.OnGamepadDisconnected);

            this._bound = false;
        }
    }

    OnCursorPositionUpdate()
    {
        this.inputMode = 0;
    }

    OnKeyDown(_event)
    {
        this.inputMode = 0;

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

    OnGamepadButtonDown(_button, _name)
    {
        this.inputMode = 1;

        for (let i = 0; i < this._gpbdListeners.length; i++)
        {
            this._gpbdListeners[i](_button, _name);
        }
    }

    OnGamepadButtonUp(_button, _name)
    {
        for (let i = 0; i < this._gpbuListeners.length; i++)
        {
            this._gpbuListeners[i](_button, _name);
        }
    }

    OnGamepadLeftStick(_valueX, _valueY)
    {
        this.inputMode = 1;

        for (let i = 0; i < this._gplsListeners.length; i++)
        {
            this._gplsListeners[i](_valueX, _valueY);
        }
    }

    OnGamepadRightStick(_valueX, _valueY)
    {
        this.inputMode = 1;

        for (let i = 0; i < this._gprsListeners.length; i++)
        {
            this._gprsListeners[i](_valueX, _valueY);
        }
    }

    OnGamepadConnected(_event)
    {
        if (this._currentGamepadIndex != null) { return; }

        this._currentGamepadIndex = _event.gamepad.index;
    }

    OnGamepadDisconnected(_event)
    {
        if (_event.gamepad.index != this._currentGamepadIndex) { return; }

        this._currentGamepadIndex = null;
    }

    AddKeyDownListener(_listener)
    {
        this._kdListeners.push(_listener);
    }

    RemoveKeyDownListener(_listener)
    {
        const _kdListenerIndex = this._kdListeners.indexOf(_listener);

        if (_kdListenerIndex == -1) { return; }

        this._kdListeners.splice(_kdListenerIndex, 1);
    }

    AddKeyUpListener(_listener)
    {
        this._kuListeners.push(_listener);
    }

    RemoveKeyUpListener(_listener)
    {
        const _kuListenerIndex = this._kuListeners.indexOf(_listener);

        if (_kuListenerIndex == -1) { return; }

        this._kuListeners.splice(_kuListenerIndex, 1);
    }

    AddGamepadButtonDownListener(_listener)
    {
        this._gpbdListeners.push(_listener);
    }

    RemoveGamepadButtonDownListener(_listener)
    {
        const _gpbdListenerIndex = this._gpbdListeners.indexOf(_listener);

        if (_gpbdListenerIndex == -1) { return; }

        this._gpbdListeners.splice(_gpbdListenerIndex, 1);
    }

    AddGamepadButtonUpListener(_listener)
    {
        this._gpbuListeners.push(_listener);
    }

    RemoveGamepadButtonUpListener(_listener)
    {
        const _gpbuListenerIndex = this._gpbuListeners.indexOf(_listener);

        if (_gpbuListenerIndex == -1) { return; }

        this._gpbuListeners.splice(_gpbuListenerIndex, 1);
    }

    AddGamepadLeftStickListener(_listener)
    {
        this._gplsListeners.push(_listener);
    }

    RemoveGamepadLeftStickListener(_listener)
    {
        const _gplsListenerIndex = this._gplsListeners.indexOf(_listener);

        if (_gplsListenerIndex == -1) { return; }

        this._gplsListeners.splice(_gplsListenerIndex, 1);
    }

    AddGamepadRightStickListener(_listener)
    {
        this._gprsListeners.push(_listener);
    }

    RemoveGamepadRightStickListener(_listener)
    {
        const _gprsListenerIndex = this._gprsListeners.indexOf(_listener);

        if (_gprsListenerIndex == -1) { return; }

        this._gprsListeners.splice(_gprsListenerIndex, 1);
    }

    get gamepad()
    {
        if (this._currentGamepadIndex == null) { return; }

        return navigator.getGamepads()[this._currentGamepadIndex];
    }
}

export class UIElement extends CursorBoxCollider
{
    constructor(gameObject, canvas, animator, textData=new TextData("", "8px VCR_OSD_MONO", "white", "center", "middle", Engine.I.UI_TEXT_DEFAULT_LAYER), width=32, height=32, sfx=[], interactable=true)
    {
        super(gameObject, width, height);

        this.canvas = canvas;
        this.animator = animator;

        this.text = gameObject.AddComponent(TextRenderer, textData);

        if (sfx.length > 0)
        {
            this._sfx = sfx;

            this.sfxPlayer = gameObject.AddComponent(AudioPlayer, this._sfx[0], Engine.I.sfxMixer, undefined, undefined, true);
        }

        else
        {
            this._sfx = [];

            this.sfxPlayer = null;
        }

        this.interactable = interactable;

        this._hovering = false;

        this._bound = false;
    }

    Start()
    {
        if (!this._bound)
        {
            this.canvas.AddElement(this);
            this._bound = true;
        }
    }

    OnEnable()
    {
        if (!this._bound)
        {
            this.canvas.AddElement(this);
            this._bound = true;
        }   
    }

    OnDisable()
    {
        super.OnDisable();

        if (this._bound)
        {
            this.canvas.RemoveElement(this);
            this._bound = false;
        }
    }

    OnDestroy()
    {
        super.OnDestroy();

        if (this._bound)
        {
            this.canvas.RemoveElement(this);
            this._bound = false;
        }
    }

    Base_OnUIHoverStart()
    {
        if (!this._interactable) { return; }

        if (this.sfxPlayer != null)
        {
            this.sfxPlayer.SetFile(this._sfx[0]);

            this.sfxPlayer.Play();
        }

        this.animator.JumpToFrame(1);

        this.OnUIHoverStart();
    }

    Base_OnUIClickStart()
    {
        if (!this._interactable) { return; }

        if (this.sfxPlayer != null)
        {
            this.sfxPlayer.SetFile(this._sfx[1]);

            this.sfxPlayer.Play();
        }

        this.animator.JumpToFrame(2);

        this.OnUIClickStart();
    }

    Base_OnUIClickEnd()
    {
        if (!this._interactable) { return; }

        if (this.sfxPlayer != null)
        {
            this.sfxPlayer.SetFile(this._sfx[2]);

            this.sfxPlayer.Play();
        }

        this.animator.JumpToFrame(1);

        this.OnUIClickEnd();
    }

    Base_OnUIHoverEnd()
    {
        if (!this._interactable) { return; }

        this.animator.JumpToFrame(0);

        this.OnUIHoverEnd();
    }

    OnCursorCollideStart()
    {
        this._hovering = true;
        this.Base_OnUIHoverStart();
    }

    OnClickStart()
    {
        this.Base_OnUIClickStart();
    }

    OnClickEnd()
    {
        this.Base_OnUIClickEnd();
    }

    OnCursorCollideEnd()
    {
        this._hovering = false;
        this.Base_OnUIHoverEnd();
    }

    OnUIHoverStart() {  }

    OnUIClickStart() {  }

    OnUIClickEnd() {  }

    OnUIHoverEnd() {  }

    get interactable()
    {
        return this._interactable;
    }

    set interactable(_value)
    {
        if (this._interactable == _value) { return; }

        if (_value)
        {
            if (this._hovering)
            {
                this.animator.JumpToFrame(1);
            }

            else
            {
                this.animator.JumpToFrame(0);
            }
        }

        else
        {
            this.animator.JumpToFrame(3);
        }

        this._interactable = _value;
    }

    get hovering()
    {
        return this._hovering;
    }
}

export class UICanvas extends Component
{
    constructor(gameObject)
    {
        super(gameObject);

        this.OnGamepadButtonDown = this.OnGamepadButtonDown.bind(this);
        this.OnGamepadButtonUp = this.OnGamepadButtonUp.bind(this);

        this.OnGamepadLeftStick = this.OnGamepadLeftStick.bind(this);

        this._elements = [];

        this._currentElement = null;

        this._indexChangeTimer = 0;
        this._indexChangeCooldown = 0.25;
    }

    Start()
    {
        if (!this._bound)
        {
            this._currentElement = null;
            this.Internal_CheckInputMode();
            this._bound = true;
        }
    }

    OnEnable()
    {
        if (!this._bound)
        {
            this._currentElement = null;
            this.Internal_CheckInputMode();
            this._bound = true;
        }
    }

    OnDisable()
    {
        this.Internal_RemoveListeners();
    }

    OnDestroy()
    {
        this.Internal_RemoveListeners();
    }

    Update()
    {
        this.Internal_CheckInputMode();

        if (this._indexChangeTimer <= 0)
        {
            this._indexChangeTimer = 0;
            return;
        }

        this._indexChangeTimer -= Engine.I.deltaTime;
    }

    Internal_CheckInputMode()
    {
        if (Engine.I.persistentScene.inputManager.inputMode == 0)
        {
            if (this._currentElement != null)
            {
                this.Internal_RemoveListeners();

                if (!this._currentElement.hovering)
                {
                    this._currentElement.Base_OnUIHoverEnd();
                }

                this._currentElement = null;
            }

            return;
        }

        if (this._currentElement == null)
        {
            this.Internal_AddListeners();

            this._currentElement = this.Internal_FindNextInteractable(this._elements[this._elements.length - 1], 1);

            if (this._currentElement != null)
            {
                this._currentElement.Base_OnUIHoverStart();
            }
        }
    }

    Internal_AddListeners()
    {
        Engine.I.persistentScene.inputManager.AddGamepadButtonDownListener(this.OnGamepadButtonDown);
        Engine.I.persistentScene.inputManager.AddGamepadButtonUpListener(this.OnGamepadButtonUp);

        Engine.I.persistentScene.inputManager.AddGamepadLeftStickListener(this.OnGamepadLeftStick);
    }

    Internal_RemoveListeners()
    {
        Engine.I.persistentScene.inputManager.RemoveGamepadButtonDownListener(this.OnGamepadButtonDown);
        Engine.I.persistentScene.inputManager.RemoveGamepadButtonUpListener(this.OnGamepadButtonUp);

        Engine.I.persistentScene.inputManager.RemoveGamepadLeftStickListener(this.OnGamepadLeftStick);

        this._bound = false;
    }

    Internal_FindNextInteractable(_startElement, _direction)
    {
        if (this._elements.length == 0) { return null; }

        let _index = this._elements.indexOf(_startElement);

        if (_index == -1) { return; }

        let _checked = 0;

        while (_checked < this._elements.length)
        {
            _index += _direction;

            if (_index >= this._elements.length) { _index = 0; }

            else if (_index < 0) { _index = this._elements.length - 1; }

            if (this._elements[_index].interactable)
            {
                return this._elements[_index];
            }

            _checked++;
        }

        return null;
    }

    Internal_FindNextByDirection(_directionX, _directionY)
    {
        if (this._currentElement == null || this._elements.length == 0) { return null; }

        let _closest = null;
        let _closestDistance = Infinity;

        for (let i = 0; i < this._elements.length; i++)
        {
            const _candidate = this._elements[i];

            if (!_candidate.interactable || _candidate == this._currentElement) { continue; }

            const _compareX = _candidate.gameObject.transform.position.x - this._currentElement.gameObject.transform.position.x;
            const _compareY = _candidate.gameObject.transform.position.y - this._currentElement.gameObject.transform.position.y;

            if (_directionX > 0 && _compareX <= 0) { continue; }
            if (_directionX < 0 && _compareX >= 0) { continue; }

            if (_directionY > 0 && _compareY <= 0) { continue; }
            if (_directionY < 0 && _compareY >= 0) { continue; }

            const _distance = _compareX * _compareX + _compareY * _compareY;

            if (_distance < _closestDistance)
            {
                _closestDistance = _distance;

                _closest = _candidate;
            }
        }

        return _closest;
    }

    Internal_MoveSelection(_directionX, _directionY)
    {
        if (this._currentElement == null) { return; }
        
        const _nextElement = this.Internal_FindNextByDirection(_directionX, _directionY);

        if (_nextElement == null) { return; }

        this._currentElement.Base_OnUIHoverEnd();

        this._currentElement = _nextElement;

        this._currentElement.Base_OnUIHoverStart();
    }

    OnGamepadButtonDown(_button, _name)
    {
        switch (_name)
        {
            case ("A"):
            {
                if (this._currentElement == null) { break; }

                this._currentElement.OnClickStart();

                break;
            }

            case ("DPadUp"):
            {
                this.Internal_MoveSelection(0, 1);

                break;
            }

            case ("DPadDown"):
            {
                this.Internal_MoveSelection(0, -1);

                break;
            }

            case ("DPadLeft"):
            {
                this.Internal_MoveSelection(-1, 0);

                break;
            }

            case ("DPadRight"):
            {
                this.Internal_MoveSelection(1, 0);

                break;
            }
        }
    }

    OnGamepadButtonUp(_button, _name)
    {
        switch (_name)
        {
            case ("A"):
            {
                if (this._currentElement == null) { break; }

                this._currentElement.OnClickEnd();

                break;
            }
        }
    }

    OnGamepadLeftStick(_valueX, _valueY)
    {
        if (this._indexChangeTimer > 0) { return; }

        let _moved = false;

        if (Math.abs(_valueX) > Math.abs(_valueY))
        {
            if (_valueX > 0.5)
            {
                this.Internal_MoveSelection(1, 0);

                _moved = true;
            }

            else if (_valueX < -0.5)
            {
                this.Internal_MoveSelection(-1, 0);

                _moved = true;
            }
        }

        else
        {
            if (_valueY > 0.5)
            {
                this.Internal_MoveSelection(0, -1);

                _moved = true;
            }

            else if (_valueY < -0.5)
            {
                this.Internal_MoveSelection(0, 1);

                _moved = true;
            }
        }

        if (_moved)
        {
            this._indexChangeTimer = this._indexChangeCooldown;
        }
    }

    AddElement(_element)
    {
        this._elements.push(_element);

        this._elements.sort
        (
            (_a, _b) => 
            {
                return _b.gameObject.transform.position.y - _a.gameObject.transform.position.y;
            }
        );
    }

    RemoveElement(_element)
    {
        const _elementIndex = this._elements.indexOf(_element);

        if (_elementIndex == -1) { return; }

        const _currentRemoved = _element == this._currentElement;

        if (_currentRemoved && this._currentElement != null)
        {
            this._currentElement.Base_OnUIHoverEnd();
        }

        this._elements.splice(_elementIndex, 1);

        if (this._elements.length == 0)
        {
            this._currentElement = null;
            return;
        }

        if (!_currentRemoved && _elementIndex < this._elements.indexOf(this._currentElement))
        {
            this._currentElement--;
            return;
        }

        if (_currentRemoved)
        {
            const _nextElement = this.Internal_FindNextInteractable(_elementIndex - 1, 1);

            this._currentElement = _nextElement;

            if (this._currentElement != null)
            {
                this._currentElement.Base_OnUIHoverStart();
            }
        }
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
        if (this == Engine.I.persistentScene)
        {
            this.cursorManager = this.root.AddComponent(CursorManager);
            this.inputManager = this.root.AddComponent(InputManager);
        }

        this.Start();
    }

    Base_Update() { this.Update(); }

    Internal_TraverseAndUpdate(_target=this.root.transform)
    {
        if (!_target.gameObject.enabled || !_target.gameObject.parentEnabled || _target.gameObject._destroyed)
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

        this._scale = scale;

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
        this.STANDARD_CONTROLLER_BUTTONS = 
        [
            "A", "B", "X", "Y", "L1", "R1", "L2", "R2",
            "Back", "Start", "LStick", "RStick", "DPadUp",
            "DPadDown", "DPadLeft", "DPadRight", "Home", "Touchpad"
        ];

        this.UI_DEFAULT_LAYER = 100;
        this.UI_TEXT_DEFAULT_LAYER = 150;

        this.missingTexture = new Image();
        this.missingTexture.src = "source/engine/textures/missingTextureA.png";

        this.missingTilemap = new Image();
        this.missingTilemap.src = "source/engine/textures/missingTilemap.png";

        this.audioCtx = new window.AudioContext();

        this.masterMixer = new AudioMixer("masterAudioMixer");

        this.sfxMixer = new AudioMixer("sfxAudioMixer", 0.7, undefined, this.masterMixer);
        this.musicMixer = new AudioMixer("musicAudioMixer", 0.7, undefined, this.masterMixer);
        this.dialogueMixer = new AudioMixer("dialogueAudioMixer", 0.7, undefined, this.masterMixer);

        this.persistentScene = new Scene();
        this.currentScene = null;

        this._deltaTime = 0;
        this._renderQueue = [];
        this._scenes = [];

        document.addEventListener("keydown", (_event) => 
            {
                if (_event.code == "Tab" || _event.code == "AltLeft" || _event.code == "MetaLeft" || _event.code == "ControlLeft")
                {
                    _event.preventDefault();
                }
            }
        )

        this._scenes.push(this.persistentScene);

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

                if (!_renderer.sprite.texture.complete || !_renderer.tiles) { continue; }

                this.ctx.save();

                this.ctx.translate(_renderer.gameObject.transform.position.x, this.height - _renderer.gameObject.transform.position.y);

                this.ctx.rotate(-(_renderer.gameObject.transform.rotation * Math.PI / 180));

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

                this.ctx.rotate(-(_renderer.gameObject.transform.rotation * Math.PI / 180));

                this.ctx.scale(_renderer.gameObject.transform.lossyScale.x, _renderer.gameObject.transform.lossyScale.y);

                this.ctx.drawImage(_renderer.sprite.texture, _renderer.sprite.sourcePosition.x, _renderer.sprite.sourcePosition.y, _renderer.sprite.sourceDimensions.x, _renderer.sprite.sourceDimensions.y, -_renderer.sprite.sourceDimensions.x / 2, -_renderer.sprite.sourceDimensions.y / 2, _renderer.sprite.sourceDimensions.x, _renderer.sprite.sourceDimensions.y);

                this.ctx.restore();
            }

            else if (this._renderQueue[i] instanceof TextRenderer)
            {
                this.ctx.save();

                this.ctx.translate(this._renderQueue[i].gameObject.transform.position.x, this.height - this._renderQueue[i].gameObject.transform.position.y);

                this.ctx.rotate(-(this._renderQueue[i].gameObject.transform.rotation * Math.PI / 180));

                this.ctx.scale(this._renderQueue[i].gameObject.transform.lossyScale.x, this._renderQueue[i].gameObject.transform.lossyScale.y);

                this.ctx.font = this._renderQueue[i].textData.font;

                this.ctx.textAlign = this._renderQueue[i].textData.alignment;
                this.ctx.textBaseline = this._renderQueue[i].textData.baseline;

                this.ctx.fillStyle = this._renderQueue[i].textData.colour;
                this.ctx.fillText(this._renderQueue[i].textData.text, 0, 0);

                this.ctx.restore();
            }
        }
    }

    set scale(_newScale)
    {
        this._scale = _newScale;

        this.c.width = this._width * this._scale.x;
        this.c.height = this._height * this._scale.y;
    }

    get scale()
    {
        return this._scale;
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

    MoveToScene(_gameObject, _scene)
    {
        const RecursiveUpdateScene = (_target) =>
        {
            _target.gameObject.scene = _scene;

            for (let i = 0; i < _target.childCount; i++)
            {
                RecursiveUpdateScene(_target.GetChild(i));
            }
        }

        _gameObject.transform.parent = _scene.root.transform;
        
        RecursiveUpdateScene(_gameObject.transform);
    }

    AddToRenderQueue(_renderer)
    {
        this._renderQueue.push(_renderer);

        this._renderQueue.sort(
        (_a, _b) => 
        { 
            let _layerA = _a.sprite ? _a.sprite.layer : _a.layer;
            let _layerB  = _b.sprite ? _b.sprite.layer : _b.layer;

            if (_layerA == _layerB)
            {
                return this._renderQueue.indexOf(_a) - this._renderQueue.indexOf(_b);
            }

            return _layerA - _layerB;
        }
        );
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

    LoadScene(_scene)
    {
        for (let i = 0; i < this._scenes.length; i++)
        {
            if (this._scenes[i] != this.persistentScene)
            {
                this.UnloadScene(this._scenes[i]);
            }
        }

        this.currentScene = _scene;
        this.AddToScenes(_scene);
    }

    UnloadScene(_scene)
    {
        if (_scene == this.currentScene)
        {
            this.currentScene = null;
        }

        _scene.root.Base_Destroy();

        this.RemoveFromScenes(_scene);
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