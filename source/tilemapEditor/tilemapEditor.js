import * as Rebound from "/source/engine/rebound.js";

class InteractableBox extends Rebound.CursorBoxCollider
{
    constructor(gameObject, width=128, height=128, tracker=null)
    {
        super(gameObject, width, height, tracker);

        this.OnClick = this.OnClick.bind(this);
    }

    OnClick(_event) {  }

    OnCursorCollideStart()
    {
        Rebound.Engine.I.c.addEventListener("mousedown", this.OnClick);
    }

    OnCursorCollideEnd()
    {
        Rebound.Engine.I.c.removeEventListener("mousedown", this.OnClick);
    }
}

class TextBox extends InteractableBox
{
    constructor(gameObject, layer=0, width=50, height=50, tracker=null, renderer=null, onEnterPressed=null)
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

class TilemapEditor extends Rebound.Scene
{
    constructor()
    {
        super();

        this.root.transform.localPosition.Add(new Rebound.Vector2(256 * Rebound.Engine.I.scale.x / 2, 240 * Rebound.Engine.I.scale.y / 2));
        this.root.transform.localScale.Multiply(new Rebound.Vector2(5, 5));

        this.testObject = new Rebound.GameObject(this);

        const _s = new Rebound.Sprite(Rebound.Engine.I.missingTilemap, undefined, undefined, new Rebound.Vector2(32, 16));

        const _rend = this.testObject.AddComponent(Rebound.TilemapRenderer, _s);
    }

    OnEnterPressed()
    {
        const _resolution = parseInt(this.resolutionTextBox.value);

        if (Number.isNaN(_resolution)) { return; }
    }
}

const _e = new Rebound.Engine(256, 240, new Rebound.Vector2(5, 5));

const _s = new TilemapEditor();

Rebound.Engine.I.AddToScenes(_s);