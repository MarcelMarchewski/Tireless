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
    Player,
    PlayerWinScreen
} from "/source/tireless/logic/player.js";

import
{
    Enemy,
    RangedEnemy,
    BossEnemy
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

// The most challenging scene. Features a boss variant enemy who can do ranged and melee attacks

export class Dojo extends Scene
{
    constructor()
    {
        super("Dojo");

        // Ensure that the persistent scene has a LevelTransferProperties component that refers to this scene to allow for level clearing and progression

        if (Engine.I.persistentScene.dojoLevelTransferProperties == undefined)
        {
            Engine.I.persistentScene.dojoLevelTransferProperties = new GameObject(Engine.I.persistentScene, "DojoLevelTransferProperties").AddComponent(LevelTransferProperties);
        }

        this.levelTransferProperties = Engine.I.persistentScene.dojoLevelTransferProperties;

        // Declare commonly shared textures

        this.playerTexture = new Image();
        this.playerTexture.src = "source/tireless/resources/textures/Shared/tirelessPlayerSamurai.png";

        this.enemyTexture = new Image();
        this.enemyTexture.src = "source/tireless/resources/textures/Shared/tirelessEnemySamurai.png";

        this.rangedEnemyTexture = new Image();
        this.rangedEnemyTexture.src = "source/tireless/resources/textures/Shared/tirelessEnemyRanged.png";

        this.bossEnemyTexture = new Image();
        this.bossEnemyTexture.src = "source/tireless/resources/textures/Shared/tirelessEnemyBoss.png";

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

        this.bossEnemyHealthUITexture = new Image();
        this.bossEnemyHealthUITexture.src = "source/tireless/resources/textures/UI/tirelessBossEnemyHealthSlider.png";
    }

    Start()
    {
        // Scene decor

        this.backgroundRenderer = new GameObject(this, "Background Renderer").AddComponent(TilemapRenderer, new Sprite(this.backgroundTexture, undefined, undefined, new Vector2(32, 32)), "source/tireless/resources/data/tilemaps/shop.json");
        this.backgroundRenderer.gameObject.transform.localPosition = new Vector2(128, 128);
        this.backgroundRenderer.gameObject.transform.scale = new Vector2(-1, 1);

        // Initialise player

        this.player = new Player(this);

        this.player.transform.position = Engine.I.persistentScene.transferProperties.position;

        // Collision setup

        this.leftWallCol = new GameObject(this, "LeftWallCol").AddComponent(WorldCollider, new Vector2(32, 256));
        this.rightWallCol = new GameObject(this, "RightWallCol").AddComponent(WorldCollider, new Vector2(32, 256));

        this.topWallCol = new GameObject(this, "TopWallCol").AddComponent(WorldCollider, new Vector2(256, 32));
        this.bottomWallCol = new GameObject(this, "BottomWallCol").AddComponent(WorldCollider, new Vector2(256, 32));

        this.leftWallCol.gameObject.transform.position = new Vector2(0, 128);
        this.rightWallCol.gameObject.transform.position = new Vector2(256, 128);

        this.topWallCol.gameObject.transform.position = new Vector2(128, 256);
        this.bottomWallCol.gameObject.transform.position = new Vector2(128, 0);

        // Health box setup

        if (this.levelTransferProperties.healthBoxUsed == undefined)
        {
            this.levelTransferProperties.healthBoxUsed = [false, false];
        }

        if (!this.levelTransferProperties.healthBoxUsed[0])
        {
            const _healthBox = new HealthBox(this, () => { this.levelTransferProperties.healthBoxUsed[0] = true; });
            _healthBox.transform.position = new Vector2(192, 192);
        }

        if (!this.levelTransferProperties.healthBoxUsed[1])
        {
            const _healthBox = new HealthBox(this, () => { this.levelTransferProperties.healthBoxUsed[1] = true; });
            _healthBox.transform.position = new Vector2(192, 64);
        }

        // Define enemies

        if (!Engine.I.persistentScene.transferProperties.gameComplete)
        {
            this.levelTransferProperties.enemies = [[new Vector2(192, 128), true]];
        }

        // If the game has been completed, spawn 3 boss enemies

        else
        {
            this.levelTransferProperties.enemies = [[new Vector2(192, 128), true], [new Vector2(192, 192), true], [new Vector2(64, 192), true]];
        }

        let _tmp = 0;

        for (let i = 0; i < this.levelTransferProperties.enemies.length; i++)
        {
            if (this.levelTransferProperties.enemies[i][1]) 
            {
                const _enemy = new BossEnemy(this, i);

                _enemy.transform.position = this.levelTransferProperties.enemies[i][0];

                _tmp += 1
            }
        }

        this.enemyCounter = _tmp;

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

        // If the boss is dead, the game has been completed

        if (_value == 0)
        {
            let _winScreen = new PlayerWinScreen(this);

            this.player.controller.UnbindListeners();
        }
    }
}