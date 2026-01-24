import * as Rebound from "/source/engine/rebound.js";

class InteractableBox extends Rebound.CursorBoxCollider
{
    constructor(gameObject, width=128, height=128, tracker=null, onClicked=null, onCursorCollideStarted=null, onCursorCollideEnded=null)
    {
        super(gameObject, width, height, tracker);

        this.OnClick = this.OnClick.bind(this);
        this.clickTarget = onClicked;

        this.onCursorCollideStarted = onCursorCollideStarted;
        this.onCursorCollideEnded = onCursorCollideEnded;
    }

    OnClick(_event) { this.clickTarget(); }

    OnCursorCollideStart()
    {
        Rebound.Engine.I.c.addEventListener("mousedown", this.OnClick);

        if (this.onCursorCollideStarted != null)
        {
            this.onCursorCollideStarted();
        }
    }

    OnCursorCollideEnd()
    {
        Rebound.Engine.I.c.removeEventListener("mousedown", this.OnClick);

        if (this.onCursorCollideEnded != null)
        {
            this.onCursorCollideEnded();
        }
    }
}

class TextBox extends InteractableBox
{
    constructor(gameObject, width=50, height=50, tracker=null, renderer=null, onEnterPressed=null)
    {
        super(gameObject, width, height, tracker);

        this._selected = false;
        this._capitalised = false;

        this._textData = new Rebound.TextData(this.gameObject, "");

        this.OnKeyDown = this.OnKeyDown.bind(this);
        this.OnKeyUp = this.OnKeyUp.bind(this);

        this.renderer = renderer;
        
        this.standardTex = new Image();
        this.standardTex.src = "source/tilemapEditor/textures/editor/textBoxStandard.png";

        this.hoverTex = new Image();
        this.hoverTex.src = "source/tilemapEditor/textures/editor/textBoxHover.png";

        this.selectedTex = new Image();
        this.selectedTex.src = "source/tilemapEditor/textures/editor/textBoxEditing.png";

        this.onEnterPressed = onEnterPressed;
    }

    OnClick(_event)
    { 
        if (this.renderer != null)
        {
            this.renderer.sprite.texture = this.selectedTex;
        }

        this._selected = true;
    }

    OnKeyDown(_event)
    {
        if (this._selected)
        {
            switch (_event.code)
            {
                case ("Shift"):
                {
                    this._capitalised = true;

                    break;
                }

                case ("Enter"):
                {
                    if (this.onEnterPressed != null)
                    {
                        this.onEnterPressed();
                    }

                    break;
                }

                case ("Backspace"):
                {
                    this._textData.text = this._textData.text.slice(0, -1);

                    break;
                }

                default:
                {
                    if (_event.key.length == 1)
                    {
                        if (!this._capitalised)
                        {
                            this._textData.text += _event.key;
                        }

                        else
                        {
                            this._textData.text += _event.key.toUpperCase();
                        }
                    }

                    break;
                }
            }
        }
    }

    OnKeyUp(_event)
    {
        if (this._selected)
        {
            switch (_event.code)
            {
                case ("Shift"):
                {
                    this._capitalised = false;
                }
            }
        }
    }

    Start()
    {
        super.Start();

        if (this.renderer != null)
        {
            this.renderer.sprite.texture = this.standardTex;
        }

        this._textData.Enqueue();
    }

    Update()
    {
        super.Update();
    }

    OnEnable()
    {
        super.OnEnable();

        if (this.renderer != null)
        {
            this.renderer.sprite.texture = this.standardTex;
        }

        this._textData.Enqueue();
    }

    OnDisable()
    {
        super.OnDisable();

        if (this.renderer != null)
        {
            this.renderer.sprite.texture = this.standardTex;
        }

        this._textData.Deque();
    }

    OnRemove()
    {
        super.OnRemove();

        if (this.renderer != null)
        {
            this.renderer.sprite.texture = this.standardTex;
        }

        this._textData.Deque();
    }

    OnCursorCollideStart()
    {
        super.OnCursorCollideStart();

        if (this.renderer != null)
        {
            this.renderer.sprite.texture = this.hoverTex;
        }

        document.addEventListener("keydown", this.OnKeyDown);
        document.addEventListener("keyup", this.OnKeyUp);
    }

    OnCursorCollideEnd()
    {
        super.OnCursorCollideEnd();

        if (this.renderer.sprite != null)
        {
            this.renderer.sprite.texture = this.standardTex;
        }
        
        document.removeEventListener("keydown", this.OnKeyDown);
        document.removeEventListener("keyup", this.OnKeyUp);

        this._selected = false;
    }

    get value()
    {
        return this._textData.text;
    }
}

class TilePicker extends Rebound.Component
{
    constructor(gameObject)
    {
        super(gameObject);

        this._tex = new Image();
        this._tex.src = "source/tilemapEditor/textures/palette/palette.png";

        this.sprite = new Rebound.Sprite(this._tex, 0, undefined, new Rebound.Vector2(16, 16));

        this.OnScrollWheel = this.OnScrollWheel.bind(this);
        this.OnKeyDown = this.OnKeyDown.bind(this);

        this.tiles = [];

        this._selectedIndex = 0;

        this._col = Math.floor((this.sprite.texture.width + Rebound.Engine.I.SPRITE_PADDING) / (this.sprite.sourceDimensions.x + Rebound.Engine.I.SPRITE_PADDING));
        this._row = Math.floor((this.sprite.texture.height + Rebound.Engine.I.SPRITE_PADDING) / (this.sprite.sourceDimensions.y + Rebound.Engine.I.SPRITE_PADDING));

        this._frameCount = this._col * this._row;

        this._hoveredSlot = null;
    }

    Start()
    {
        Rebound.Engine.I.c.addEventListener("wheel", this.OnScrollWheel);
        
        document.addEventListener("keydown", this.OnKeyDown);
    }

    OnScrollWheel(_event)
    {
        if (_event.deltaY > 0)
        {
            this._selectedIndex--;

            if (this._selectedIndex < 0)
            {
                this._selectedIndex = this._frameCount - 1;
            }
        }

        else if (_event.deltaY < 0)
        {
            this._selectedIndex++;

            if (this._selectedIndex > this._frameCount - 1)
            {
                this._selectedIndex = 0;
            }
        }

        if (this._hoveredSlot != null)
        {
            this._hoveredSlot.renderer.sprite = this.currentSprite;
        }
    }

    OnKeyDown(_event)
    {
        switch (_event.code)
        {
            case ("KeyK"):
            {
                this.Export();

                break;
            }
        }
    }

    Export()
    {
        let _data = [];

        let _currentCommand = null;
        let _currentCommandCounter = 0;

        for (let i = 0; i < this.tiles.length; i++)
        {
            const _tileCommand = this.tiles[i]._spriteIndex;

            if (_tileCommand == -1)
            {
                if (_currentCommand != null)
                {
                    _data.push(String(_currentCommand) + "x" + String(_currentCommandCounter));

                    _currentCommand = null;
                    _currentCommandCounter = 0;
                }

                _data.push("-1x1");
                continue;
            }

            if (_tileCommand == _currentCommand)
            {
                _currentCommandCounter++;
            }

            else
            {
                if (_currentCommand != null)
                {
                    _data.push(String(_currentCommand) + "x" + String(_currentCommandCounter));
                }

                _currentCommand = _tileCommand;
                _currentCommandCounter = 1;
            }
        }

        if (_currentCommand != null)
        {
            _data.push(String(_currentCommand) + "x" + String(_currentCommandCounter));
        }

        const _date = new Date();

        console.info("Exporting tilemap data at " + _date.getHours() + ":" + _date.getMinutes() + ":" + _date.getSeconds() + " on " + _date.getDay() + "/" + _date.getMonth() + 1 + "/" + _date.getFullYear());
        console.info(JSON.stringify(_data));
    }

    get currentSprite()
    {
        return new Rebound.Sprite(this._tex, 0, new Rebound.Vector2((this._selectedIndex % this._col) * (this.sprite.sourceDimensions.x + Rebound.Engine.I.SPRITE_PADDING), Math.floor(this._selectedIndex / this._col) * (this.sprite.sourceDimensions.y + Rebound.Engine.I.SPRITE_PADDING)), new Rebound.Vector2(this.sprite.sourceDimensions.x, this.sprite.sourceDimensions.y));
    }

    get currentSpriteIndex()
    {
        return this._selectedIndex;
    }
}

class TileSlot extends Rebound.GameObject
{
    constructor(scene, name="TileSlot", parent=null, scale=8)
    {
        super(scene, name, parent);

        this.OnClicked = this.OnClicked.bind(this);
        this.OnKeyDown = this.OnKeyDown.bind(this);

        this.OnCursorCollideStarted = this.OnCursorCollideStarted.bind(this);
        this.OnCursorCollideEnded = this.OnCursorCollideEnded.bind(this);

        this.interactionManager = this.AddComponent(InteractableBox, scale * 2, scale * 2, undefined, this.OnClicked, this.OnCursorCollideStarted, this.OnCursorCollideEnded);

        this._defaultTex = new Image();
        this._defaultTex.src = "source/tilemapEditor/textures/editor/tileEmpty.png";

        this._hoverTex = new Image();
        this._hoverTex.src = "source/tilemapEditor/textures/editor/tileHover.png";

        this._defaultSprite = new Rebound.Sprite(this._defaultTex, undefined, undefined, new Rebound.Vector2(16, 16));
        this._hoverSprite = new Rebound.Sprite(this._hoverTex);

        this.renderer = this.AddComponent(Rebound.SpriteRenderer, this._defaultSprite);

        this.tilePicker = this.transform.parent.gameObject.GetComponent(TilePicker);

        this._spriteIndex = -2;

        document.addEventListener("keydown", this.OnKeyDown);
    }

    OnClicked()
    {
        this._defaultSprite = this.tilePicker.currentSprite;

        this._spriteIndex = this.tilePicker.currentSpriteIndex;
    }

    OnKeyDown(_event)
    {
        if (this.tilePicker._hoveredSlot != this) { return; }

        switch (_event.code)
        {
            case ("KeyE"):
            {
                this._defaultSprite = new Rebound.Sprite(this._defaultTex, undefined, undefined, new Rebound.Vector2(16, 16));

                this._spriteIndex = -2;

                break;
            }
        }
    }

    OnCursorCollideStarted()
    {
        this.tilePicker._hoveredSlot = this;
        this.renderer.sprite = this.tilePicker.currentSprite;
    }

    OnCursorCollideEnded()
    {
        if (this.tilePicker._hoveredSlot == this)
        {
            this.tilePicker._hoveredSlot = null;
        }

        this.renderer.sprite = this._defaultSprite;
    }
}

class LineBreakTileSlot
{
    constructor()
    {
        this._spriteIndex = -1;
    }
}

class TilemapEditor extends Rebound.Scene
{
    constructor()
    {
        super();
    }

    Start()
    {
        this.resolutionManager = new Rebound.GameObject(this, "ResolutionManager");

        this.resolutionManager.transform.localPosition = new Rebound.Vector2(20, 348);

        this.resolutionRendererObject = new Rebound.GameObject(this, "Renderer", this.resolutionManager.transform);
        this.resolutionRendererObject.transform.localScale = new Rebound.Vector2(5, 5);
        this.textBoxObject = new Rebound.GameObject(this, "TextBox", this.resolutionManager.transform);

        this._tex = new Image();
        this._tex.src = "source/tilemapEditor/textures/editor/textBoxStandard.png";

        this._sprite = new Rebound.Sprite(this._tex);

        this.resolutionRenderer = this.resolutionRendererObject.AddComponent(Rebound.SpriteRenderer, this._sprite);

        this.OnEnterPressed = this.OnEnterPressed.bind(this);

        this.resolutionTextBox = this.textBoxObject.AddComponent(TextBox, 100, 100, null, this.resolutionRenderer, this.OnEnterPressed);

        this.tileManager = new Rebound.GameObject(this, "TileManager");

        this.tilePicker = this.tileManager.AddComponent(TilePicker);
    }

    OnEnterPressed()
    {
        const _resolution = parseInt(this.resolutionTextBox.value);

        if (Number.isNaN(_resolution)) { return; }

        this.tileManager.tiles = [];

        const _col = 256 / _resolution;
        const _row = 240 / _resolution;

        for (let y = 0; y < _row; y++)
        {
            for (let x = 0; x < _col; x++)
            {
                const _tile = new TileSlot(this, undefined, this.tileManager.transform, _resolution / 2);

                _tile.transform.localPosition = new Rebound.Vector2(_resolution / 2 + x * _resolution, 232 - y * _resolution);

                this.tilePicker.tiles.push(_tile);
            }

            if (y != _row - 1)
            {
                this.tilePicker.tiles.push(new LineBreakTileSlot());
            }
        }
    }
}

class TilemapViewer extends Rebound.Scene
{
    constructor()
    {
        super();

        this.renderer = new Rebound.GameObject(this, "Tilemap Viewer");

        const _tex = new Image();
        _tex.src = "source/tilemapEditor/textures/palette/palette.png";

        const _spriteSheet = new Rebound.Sprite(_tex, undefined, undefined, new Rebound.Vector2(16, 16));

        this.renderer.transform.localPosition = new Rebound.Vector2(128, 120);

        this.renderer.AddComponent(Rebound.TilemapRenderer, _spriteSheet, "source/tilemapEditor/data/out.json");
    }
}

const _e = new Rebound.Engine(256, 368, new Rebound.Vector2(2, 2));

const _s = new TilemapEditor();

Rebound.Engine.I.AddToScenes(_s);