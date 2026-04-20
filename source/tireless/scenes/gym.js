import 
{
    GameObject,
    Scene,
    SpriteRenderer,
    TilemapRenderer,
    Sprite,
    AABB,
    Vector2,
    Engine
} from "/source/engine/rebound.js";

import
{
    Player
} from "/source/tireless/logic/player.js";

import 
{
    BlockUI,
    DashUI
} from "/source/tireless/logic/UI.js";

class WorldCollider extends AABB
{
    constructor(gameObject, dimensions)
    {
        super(gameObject, dimensions);
    }
}

export class Gym extends Scene
{
    constructor()
    {
        super();

        this.playerTexture = new Image();
        this.playerTexture.src = "source/tireless/resources/textures/Shared/tirelessPlayerSamurai.png";

        this.dashCursorTexture = new Image();
        this.dashCursorTexture.src = "source/tireless/resources/textures/Shared/dashCursor.png";

        this.blockCursorTexture = new Image();
        this.blockCursorTexture.src = "source/tireless/resources/textures/Shared/blockCursor.png";

        this.backgroundTexture = new Image();
        this.backgroundTexture.src = "source/tireless/resources/textures/Gym/gymBackground.png";

        this.blockUITexture = new Image();
        this.blockUITexture.src = "source/tireless/resources/textures/UI/tirelessBlockSlider.png";

        this.dashUITexture = new Image();
        this.dashUITexture.src = "source/tireless/resources/textures/UI/tirelessDashBar.png";
    }

    Start()
    {
        this.backgroundRenderer = new GameObject(this, "Background Renderer").AddComponent(TilemapRenderer, new Sprite(this.backgroundTexture, undefined, undefined, new Vector2(16, 16)), "source/tireless/resources/data/tilemaps/gym.json");
        this.backgroundRenderer.gameObject.transform.localPosition = new Vector2(128, 128);

        this.player = new Player(this);

        this.blockUI = new BlockUI(this);
        this.blockUI.transform.position = new Vector2(48, 24);

        this.dashUI = new DashUI(this);
        this.dashUI.transform.position = new Vector2(80, 24);

        this.testCol = new GameObject(this, "TestCol").AddComponent(WorldCollider, new Vector2(32, 32));

        this.testCol.renderer = new GameObject(this, "Renderer", this.testCol.gameObject.transform).AddComponent(SpriteRenderer, new Sprite(Engine.I.missingTexture, undefined, undefined, new Vector2(2, 2)));
        this.testCol.renderer.gameObject.transform.scale = new Vector2(16, 16);

        this.testCol.gameObject.transform.position = new Vector2(128, 128);
    }
}