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
    HealthUI,
    PlayerScoreUI
} from "/source/tireless/logic/UI.js";

import
{
    HealthBox,
    LevelSwapper,
    ShopGun,
    ShopKey
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
    Town
} from "/source/tireless/scenes/town.js";

// Safe level where the player can spend their score on utilities such as the gun or the key to the courtyard

export class Shop extends Scene
{
    constructor()
    {
        super("Shop");

        // Ensure that the persistent scene has a LevelTransferProperties component that refers to this scene to allow for level clearing and progression

        if (Engine.I.persistentScene.townLevelTransferProperties == undefined)
        {
            Engine.I.persistentScene.townLevelTransferProperties = new GameObject(Engine.I.persistentScene, "ShopLevelTransferProperties").AddComponent(LevelTransferProperties);
        }

        this.levelTransferProperties = Engine.I.persistentScene.townLevelTransferProperties;

        // Declare commonly shared textures

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
        this.backgroundTexture.src = "source/tireless/resources/textures/Shared/tirelessBuildingInterior.png";

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
        // Scene decor

        this.backgroundRenderer = new GameObject(this, "Background Renderer").AddComponent(TilemapRenderer, new Sprite(this.backgroundTexture, undefined, undefined, new Vector2(32, 32)), "source/tireless/resources/data/tilemaps/shop.json");
        this.backgroundRenderer.gameObject.transform.localPosition = new Vector2(128, 128);

        // Player initialisation

        this.player = new Player(this);

        this.player.transform.position = Engine.I.persistentScene.transferProperties.position;

        // Collision setup

        this.leftWallCol = new GameObject(this, "LeftWallCol").AddComponent(WorldCollider, new Vector2(32, 256));

        this.topWallCol = new GameObject(this, "TopWallCol").AddComponent(WorldCollider, new Vector2(256, 32));
        this.bottomWallCol = new GameObject(this, "BottomWallCol").AddComponent(WorldCollider, new Vector2(256, 32));

        this.rWallTopCol = new GameObject(this, "TLBuildingCol").AddComponent(WorldCollider, new Vector2(32, 128));
        this.rWallBottomCol = new GameObject(this, "TRBuildingCol").AddComponent(WorldCollider, new Vector2(32, 128));

        this.leftWallCol.gameObject.transform.position = new Vector2(0, 128);

        this.topWallCol.gameObject.transform.position = new Vector2(128, 256);
        this.bottomWallCol.gameObject.transform.position = new Vector2(128, 0);

        this.rWallTopCol.gameObject.transform.position = new Vector2(256, 192);
        this.rWallBottomCol.gameObject.transform.position = new Vector2(256, 64);

        // Exit setup

        this.townExit = new LevelSwapper(this, new Vector2(16, 16), () => { Engine.I.persistentScene.transferProperties.health = this.player.controller.health; Engine.I.persistentScene.transferProperties.position = new Vector2(112, 128); let _fader = new LevelTransitionFader(this, () => { Engine.I.LoadScene(new LevelTransition("Town", Town)); }); this.player.controller.UnbindListeners(); });
        this.townExit.transform.position = new Vector2(240, 128);

        this.townExit.renderer.enabled = false;
        this.townExit.unlockedObject.renderer.enabled = true;

        this.townExit.transform.rotation = -90;

        // Health box setup

        if (this.levelTransferProperties.healthBoxUsed == undefined)
        {
            this.levelTransferProperties.healthBoxUsed = [false];
        }

        if (!this.levelTransferProperties.healthBoxUsed[0])
        {
            const _healthBox = new HealthBox(this, () => { this.levelTransferProperties.healthBoxUsed[0] = true; });
            _healthBox.transform.position = new Vector2(128, 128);
        }

        // Shop item setup

        if (!Engine.I.persistentScene.transferProperties.playerHasGun)
        {
            const _gun = new ShopGun(this);
            _gun.transform.position = new Vector2(64, 160);
        }

        if (!Engine.I.persistentScene.transferProperties.keys[0])
        {
            const _key = new ShopKey(this);
            _key.transform.position = new Vector2(192, 160);
        }

        this.player.controller.health = Engine.I.persistentScene.transferProperties.health;

        // Initialise UI

        this.blockUI = new BlockUI(this);
        this.blockUI.transform.position = new Vector2(32, 8);

        this.dashUI = new DashUI(this);
        this.dashUI.transform.position = new Vector2(64, 8);

        this.healthUI = new HealthUI(this);
        this.healthUI.transform.position = new Vector2(32, 23);

        this.playerScoreUI = new PlayerScoreUI(this);
        this.playerScoreUI.transform.position = new Vector2(8, 240);

        let _fader = new LevelTransitionFader(this, undefined, true);
    }

    get enemyCounter()
    {
        return this._enemyCounter;
    }

    set enemyCounter(_value)
    {
        this._enemyCounter = _value;
    }
}