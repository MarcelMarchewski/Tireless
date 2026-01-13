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
            this.renderer.texture = this.selectedTex;
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
            this.renderer.texture = this.standardTex;
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
            this.renderer.texture = this.standardTex;
        }

        this._textData.Enqueue();
    }

    OnDisable()
    {
        super.OnDisable();

        if (this.renderer != null)
        {
            this.renderer.texture = this.standardTex;
        }

        this._textData.Deque();
    }

    OnRemove()
    {
        super.OnRemove();

        if (this.renderer != null)
        {
            this.renderer.texture = this.standardTex;
        }

        this._textData.Deque();
    }

    OnCursorCollideStart()
    {
        super.OnCursorCollideStart();

        if (this.renderer != null)
        {
            this.renderer.texture = this.hoverTex;
        }

        document.addEventListener("keydown", this.OnKeyDown);
        document.addEventListener("keyup", this.OnKeyUp);
    }

    OnCursorCollideEnd()
    {
        super.OnCursorCollideEnd();

        if (this.renderer != null)
        {
            this.renderer.texture = this.standardTex;
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

        this.resolutionContainer = new Rebound.GameObject(this, "ResolutionContainer");

        this.resolutionContainerRenderer = new Rebound.GameObject(this, "Renderer", this.resolutionContainer.transform);

        this.resolutionContainerBox = new Rebound.GameObject(this, "Text Box", this.resolutionContainer.transform);

        this.testSprite = new Rebound.GameObject(this, "Test Sprite");

        this.testSprite.transform.localPosition = new Rebound.Vector2(100, 100);
        this.testSprite.transform.localScale = new Rebound.Vector2(5, 5);

        this.testTexture = new Image();
        this.testTexture.src = "source/tilemapEditor/textures/debug/t_missingTilemap.png";

        const _testRend = this.testSprite.AddComponent(Rebound.SpriteRenderer, this.testTexture, 0, new Rebound.Vector2(32, 16));
        this.testSprite.AddComponent(Rebound.Animator, _testRend, 5);

        this.missingTex = new Image();
        this.missingTex.src = "source/engine/textures/missingTextureA.png";

        this.resolutionContainer.transform.localPosition = new Rebound.Vector2(50, 743);

        this.resolutionContainerRenderer.transform.localScale.Multiply(new Rebound.Vector2(12.5, 6.25));
        
        const _rend = this.resolutionContainerRenderer.AddComponent(Rebound.SpriteRenderer, this.missingTex, 0, new Rebound.Vector2(8, 8));

        this.OnEnterPressed = this.OnEnterPressed.bind(this);
        this.resolutionTextBox = this.resolutionContainerBox.AddComponent(TextBox, 0, 50, 25, null, _rend, this.OnEnterPressed);

        //this.tilemap = new Image();
        //this.tilemap.src = "source/tilemapEditor/textures/palette/.png";
    }

    OnEnterPressed()
    {
        const _resolution = parseInt(this.resolutionTextBox.value);

        if (Number.isNaN(_resolution)) { return; }
    }
}

const _e = new Rebound.Engine(512, 768);

const _s = new TilemapEditor();

Rebound.Engine.I.AddToScenes(_s);