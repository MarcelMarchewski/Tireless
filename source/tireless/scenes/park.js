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
    Enemy,
    RangedEnemy
} from "/source/tireless/logic/enemy.js";

import 
{
    BlockUI,
    DashUI,
    HealthUI
} from "/source/tireless/logic/UI.js";

import
{
    HealthBox,
    LevelSwapper
} from "/source/tireless/logic/interactables.js";

import
{
    WorldCollider,
    WaterCollider,
    PlayerOnlyCollider,
    TransferProperties,
    LevelTransferProperties
} from "/source/tireless/tireless.js";

import
{
    LevelTransition,
    LevelTransitionFader
} from "/source/tireless/scenes/levelTransition.js";

import
{
    Junction
} from "/source/tireless/scenes/junction.js";

export class Park extends Scene
{
    constructor()
    {
        super("Park");

        if (Engine.I.persistentScene.parkTransferProperties == undefined)
        {
            Engine.I.persistentScene.parkTransferProperties = new GameObject(Engine.I.persistentScene, "ParkTransferProperties").AddComponent(LevelTransferProperties, false);
        }

        this.playerTexture = new Image();
        this.playerTexture.src = "source/tireless/resources/textures/Shared/tirelessPlayerSamurai.png";

        this.enemyTexture = new Image();
        this.enemyTexture.src = "source/tireless/resources/textures/Shared/tirelessEnemySamurai.png";

        this.rangedEnemyTexture = new Image();
        this.rangedEnemyTexture.src = "source/tireless/resources/textures/Shared/tirelessEnemyRanged.png";

        this.dashCursorTexture = new Image();
        this.dashCursorTexture.src = "source/tireless/resources/textures/Shared/dashCursor.png";

        this.blockCursorTexture = new Image();
        this.blockCursorTexture.src = "source/tireless/resources/textures/Shared/blockCursor.png";

        this.backgroundTexture = new Image();
        this.backgroundTexture.src = "source/tireless/resources/textures/Shared/tirelessAlleyway.png";

        this.foregroundTexture = new Image();
        this.foregroundTexture.src = "source/tireless/resources/textures/Shared/tirelessAlleywayProps.png";

        this.parkTexture = new Image();
        this.parkTexture.src = "source/tireless/resources/textures/Shared/tirelessPark.png";

        this.blockUITexture = new Image();
        this.blockUITexture.src = "source/tireless/resources/textures/UI/tirelessBlockSlider.png";

        this.dashUITexture = new Image();
        this.dashUITexture.src = "source/tireless/resources/textures/UI/tirelessDashBar.png";

        this.healthUITexture = new Image();
        this.healthUITexture.src = "source/tireless/resources/textures/UI/tirelessHealthSlider.png";

        this.enemyHealthUITexture = new Image();
        this.enemyHealthUITexture.src = "source/tireless/resources/textures/UI/tirelessEnemyHealthSlider.png";
    }

    Start()
    {
        this.backgroundRenderer = new GameObject(this, "Background Renderer").AddComponent(TilemapRenderer, new Sprite(this.backgroundTexture, undefined, undefined, new Vector2(32, 32)), "source/tireless/resources/data/tilemaps/park.json");
        this.backgroundRenderer.gameObject.transform.localPosition = new Vector2(128, 128);

        this.foregroundRenderer = new GameObject(this, "Foreground Renderer").AddComponent(TilemapRenderer, new Sprite(this.foregroundTexture, undefined, undefined, new Vector2(32, 32)), "source/tireless/resources/data/tilemaps/parkProps.json");
        this.foregroundRenderer.gameObject.transform.localPosition = new Vector2(128, 128);

        this.parkRenderer = new GameObject(this, "Park Renderer").AddComponent(TilemapRenderer, new Sprite(this.parkTexture, undefined, undefined, new Vector2(32, 32)), "source/tireless/resources/data/tilemaps/parkGrass.json");
        this.parkRenderer.gameObject.transform.localPosition = new Vector2(128, 128);

        this.player = new Player(this);

        this.player.transform.position = Engine.I.persistentScene.transferProperties.position;

        this.blockUI = new BlockUI(this);
        this.blockUI.transform.position = new Vector2(32, 8);

        this.dashUI = new DashUI(this);
        this.dashUI.transform.position = new Vector2(64, 8);

        this.healthUI = new HealthUI(this);
        this.healthUI.transform.position = new Vector2(32, 23);

        this.leftWallCol = new GameObject(this, "LeftWallCol").AddComponent(WorldCollider, new Vector2(32, 256));
        this.rightWallCol = new GameObject(this, "RightWallCol").AddComponent(WorldCollider, new Vector2(32, 256));

        this.topWallCol = new GameObject(this, "TopWallCol").AddComponent(WorldCollider, new Vector2(256, 32));
        this.bottomWallCol = new GameObject(this, "BottomWallCol").AddComponent(WorldCollider, new Vector2(256, 32));

        this.tlBuildingCol = new GameObject(this, "TLBuildingCol").AddComponent(WorldCollider, new Vector2(128, 128));
        this.trBuildingCol = new GameObject(this, "TRBuildingCol").AddComponent(WorldCollider, new Vector2(128, 128));

        this.waterCol = new GameObject(this, "WaterCol").AddComponent(WaterCollider, new Vector2(96, 128));

        this.leftWallCol.gameObject.transform.position = new Vector2(-16, 128);
        this.rightWallCol.gameObject.transform.position = new Vector2(272, 128);

        this.topWallCol.gameObject.transform.position = new Vector2(128, 272);
        this.bottomWallCol.gameObject.transform.position = new Vector2(128, -16);

        this.tlBuildingCol.gameObject.transform.position = new Vector2(0, 256);
        this.trBuildingCol.gameObject.transform.position = new Vector2(256, 256);

        this.waterCol.gameObject.transform.position = new Vector2(128, 48);

        this.alleywayExit = new LevelSwapper(this, new Vector2(16, 16), () => { Engine.I.persistentScene.transferProperties.health = this.player.controller.health; Engine.I.persistentScene.transferProperties.position = new Vector2(128, 48); let _fader = new LevelTransitionFader(this, () => { Engine.I.LoadScene(new LevelTransition("Junction", Junction)); }); this.player.controller.UnbindListeners(); });
        this.alleywayExit.transform.position = new Vector2(128, 240);

        this.alleywayExit.renderer.enabled = false;
        this.alleywayExit.unlockedObject.renderer.enabled = true;

        this.enemies = [];

        if (!Engine.I.persistentScene.parkTransferProperties.clear)
        {
            for (let i = 0; i < 2; i++)
            {
                const _enemy = new RangedEnemy(this);

                this.enemies.push(_enemy);
            }

            this.enemies[0].transform.position = new Vector2(48, 0);
            this.enemies[1].transform.position = new Vector2(208, 0);

            this.enemyCounter = this.enemies.length;
        }

        else
        {
            this.enemyCounter = 0;
        }

        this.player.controller.health = Engine.I.persistentScene.transferProperties.health;

        let _fader = new LevelTransitionFader(this, undefined, true);
    }

    get enemyCounter()
    {
        return this._enemyCounter;
    }

    set enemyCounter(_value)
    {
        this._enemyCounter = _value;

        if (this._enemyCounter == 0)
        {
            Engine.I.persistentScene.parkTransferProperties.clear = true;
        }
    }
}