import 
{
    Component,
    GameObject,
    Scene,
    SpriteRenderer,
    TilemapRenderer,
    Sprite,
    Animator,
    AnimationClip,
    UICanvas,
    TextData,
    AABB,
    Vector2,
    Engine,
    AudioPlayer
} from "/source/engine/rebound.js";

export class TileGrid extends Component
{
    constructor(gameObject, sprite, width, height)
    {
        super(gameObject);

        this.sprite = sprite;

        this.width = width;
        this.height = height;

        this.tileSize = sprite.sourceDimensions;

        this.grid = [];
        this.renderers = [];
    }

    Start()
    {
        for (let y = 0; y < this.height; y++)
        {
            this.grid[y] = [];
            this.renderers[y] = [];

            for (let x = 0; x < this.width; x++)
            {
                this.grid[y][x] = 0;

                const tileGO = new GameObject(this.gameObject.scene, `Tile_${x}_${y}`);

                tileGO.transform.parent = this.gameObject.transform;

                const offsetX = (this.width * this.tileSize.x) / 2;
                const offsetY = (this.height * this.tileSize.y) / 2;

                tileGO.transform.localPosition = new Vector2(
                    x * this.tileSize.x - offsetX + this.tileSize.x / 2,
                    y * this.tileSize.y - offsetY + this.tileSize.y / 2
                );

                const sr = tileGO.AddComponent(SpriteRenderer, new Sprite(
                    this.sprite.texture,
                    this.sprite.layer,
                    Vector2.zero,
                    this.tileSize
                ));

                this.renderers[y][x] = sr;
            }
        }

        this.UpdateVisuals();
    }

    SetTile(x, y, index)
    {
        if (!this.grid[y] || this.grid[y][x] == null) return;

        this.grid[y][x] = index;

        const renderer = this.renderers[y][x];

        // EMPTY TILE → hide sprite
        if (index < 0)
        {
            renderer.enabled = false; // or renderer.gameObject.active = false (depending on engine)
            return;
        }

        renderer.enabled = true;

        const tilePos = this.GetTileUV(index);
        renderer.sprite.sourcePosition = tilePos;
    }

    GetTileUV(index)
    {
        const gap = 1; // your actual gap

        const tilesPerRow = Math.floor(
            (this.sprite.texture.width + gap) / (this.tileSize.x + gap)
        );

        const xIndex = index % tilesPerRow;
        const yIndex = Math.floor(index / tilesPerRow);

        const x = xIndex * (this.tileSize.x + gap);
        const y = yIndex * (this.tileSize.y + gap);

        return new Vector2(x, y);
    }

    UpdateVisuals()
    {
        for (let y = 0; y < this.height; y++)
        {
            for (let x = 0; x < this.width; x++)
            {
                this.SetTile(x, y, this.grid[y][x]);
            }
        }
    }

    ExportToRLE()
    {
        const data = [];

        for (let y = 0; y < this.height; y++)
        {
            let current = this.grid[y][0];
            let count = 1;

            for (let x = 1; x < this.width; x++)
            {
                const tile = this.grid[y][x];

                if (tile === current)
                {
                    count++;
                }
                else
                {
                    data.push(`${current}x${count}`);
                    current = tile;
                    count = 1;
                }
            }

            // flush row
            data.push(`${current}x${count}`);

            // row break (except last row)
            if (y < this.height - 1)
            {
                data.push(`-1x1`);
            }
        }

        return data;
    }

    ExportToJSON()
    {
        return JSON.stringify(this.ExportToRLE());
    }
}

export class TilemapPainter extends Component
{
    constructor(gameObject, grid)
    {
        super(gameObject);

        this.grid = grid;

        this._cursorManager = Engine.I.persistentScene.cursorManager;

        this._currentTile = 0;
        this._mouseDownLeft = false;
        this._eraseHeld = false;

        this.OnMouseDown = this.OnMouseDown.bind(this);
        this.OnMouseUp = this.OnMouseUp.bind(this);
        this.OnScroll = this.OnScroll.bind(this);

        this.OnKeyDown = this.OnKeyDown.bind(this);
        this.OnKeyUp = this.OnKeyUp.bind(this);
    }

    Start()
    {
        Engine.I.c.addEventListener("mousedown", this.OnMouseDown);
        Engine.I.c.addEventListener("mouseup", this.OnMouseUp);
        Engine.I.c.addEventListener("wheel", this.OnScroll);

        window.addEventListener("keydown", this.OnKeyDown);
        window.addEventListener("keyup", this.OnKeyUp);
    }

    OnMouseDown(e)
    {
        if (e.button === 0) this._mouseDownLeft = true;
    }

    OnMouseUp(e)
    {
        if (e.button === 0) this._mouseDownLeft = false;
    }

    OnKeyDown(e)
    {
        if (e.code === "KeyE")
        {
            this._eraseHeld = true;
        }
    }

    OnKeyUp(e)
    {
        if (e.code === "KeyE")
        {
            this._eraseHeld = false;
        }

        if (e.code === "KeyS") // SAVE
        {
            const json = this.grid.ExportToJSON();
            console.log(json);
        
            navigator.clipboard.writeText(json);
            console.log("Tilemap copied to clipboard");
        }
    }

    OnScroll(e)
    {
        const maxIndex = 1000; // or derive from tileset

        this._currentTile -= (e.deltaY > 0 ? 1 : -1);
        this._currentTile = Math.max(0, Math.min(maxIndex, this._currentTile));

        console.log("Tile:", this._currentTile);
    }

    Update()
    {
        if (!this._mouseDownLeft && !this._eraseHeld) return;

        const cursor = this._cursorManager.cursorPosition;

        const gridPos = this.grid.gameObject.transform.position;
        const tileSize = this.grid.tileSize;

        const halfWidth = (this.grid.width * tileSize.x) / 2;
        const halfHeight = (this.grid.height * tileSize.y) / 2;

        const localX = cursor.x - gridPos.x + halfWidth;
        const localY = cursor.y - gridPos.y + halfHeight;

        const x = Math.floor(localX / tileSize.x);
        const y = Math.floor(localY / tileSize.y);

        if (!this.grid.grid[y] || this.grid.grid[y][x] == null) return;

        // paint
        if (this._mouseDownLeft)
        {
            this.grid.SetTile(x, y, this._currentTile);
        }

        // erase (hold E)
        if (this._eraseHeld)
        {
            this.grid.SetTile(x, y, -1);
        }
    }
}

class TilemapEditor extends Scene
{
    constructor()
    {
        super();

        this.backgroundTexture = new Image();
        this.backgroundTexture.src = "source/tilemapEditor/textures/palette/palette.png";

        this.grid = new GameObject(this, "Grid").AddComponent(TileGrid, new Sprite(this.backgroundTexture, undefined, undefined, new Vector2(32, 32)), 8, 8);
        this.grid.gameObject.transform.localPosition = new Vector2(
        Engine.I.width / 2,
        Engine.I.height / 2
        );
        this.painter = this.root.AddComponent(TilemapPainter, this.grid);
    }
}


const _baseWidth = 256;
const _baseHeight = 256;

const _scale = Math.floor(Math.min(window.innerWidth / _baseWidth, window.innerHeight / _baseHeight));

new Engine(256, 256, new Vector2(_scale, _scale), false, "10px solid white");

const _s = new TilemapEditor();

Engine.I.LoadScene(_s);