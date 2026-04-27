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

import
{
    Shop
} from "/source/tireless/scenes/shop.js";

export class Town extends Scene
{
    constructor()
    {
        super("Town");

        if (Engine.I.persistentScene.townLevelTransferProperties == undefined)
        {
            Engine.I.persistentScene.townLevelTransferProperties = new GameObject(Engine.I.persistentScene, "TownLevelTransferProperties").AddComponent(LevelTransferProperties);
        }

        this.levelTransferProperties = Engine.I.persistentScene.townLevelTransferProperties;

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
        this.foregroundTexture.src = "source/tireless/resources/textures/Shared/tirelessShop.png";

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
        this.backgroundRenderer = new GameObject(this, "Background Renderer").AddComponent(TilemapRenderer, new Sprite(this.backgroundTexture, undefined, undefined, new Vector2(32, 32)), "source/tireless/resources/data/tilemaps/town.json");
        this.backgroundRenderer.gameObject.transform.localPosition = new Vector2(128, 128);

        this.foregroundRenderer = new GameObject(this, "Town Renderer").AddComponent(TilemapRenderer, new Sprite(this.foregroundTexture, undefined, undefined, new Vector2(32, 32)), "source/tireless/resources/data/tilemaps/townBuildings.json");
        this.foregroundRenderer.gameObject.transform.localPosition = new Vector2(128, 128);

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

        this.lBuildingCol = new GameObject(this, "TLBuildingCol").AddComponent(WorldCollider, new Vector2(128, 192));
        this.rBuildingCol = new GameObject(this, "TRBuildingCol").AddComponent(WorldCollider, new Vector2(128, 192));

        this.leftWallCol.gameObject.transform.position = new Vector2(-16, 128);
        this.rightWallCol.gameObject.transform.position = new Vector2(272, 128);

        this.topWallCol.gameObject.transform.position = new Vector2(128, 272);
        this.bottomWallCol.gameObject.transform.position = new Vector2(128, -16);

        this.lBuildingCol.gameObject.transform.position = new Vector2(0, 128);
        this.rBuildingCol.gameObject.transform.position = new Vector2(256, 128);

        this.junctionExit = new LevelSwapper(this, new Vector2(16, 16), () => { Engine.I.persistentScene.transferProperties.health = this.player.controller.health; Engine.I.persistentScene.transferProperties.position = new Vector2(128, 208); let _fader = new LevelTransitionFader(this, () => { Engine.I.LoadScene(new LevelTransition("Junction", Junction)); }); this.player.controller.UnbindListeners(); });
        this.junctionExit.transform.position = new Vector2(128, 16);

        this.junctionExit.renderer.enabled = false;
        this.junctionExit.unlockedObject.renderer.enabled = true;

        this.junctionExit.transform.rotation = 180;

        this.shopExit = new LevelSwapper(this, new Vector2(16, 16), () => { Engine.I.persistentScene.transferProperties.health = this.player.controller.health; Engine.I.persistentScene.transferProperties.position = new Vector2(224, 128); let _fader = new LevelTransitionFader(this, () => { Engine.I.LoadScene(new LevelTransition("Shop", Shop)); }); this.player.controller.UnbindListeners(); });
        this.shopExit.transform.position = new Vector2(96, 128);

        this.shopExit.renderer.enabled = false;
        this.shopExit.unlockedObject.renderer.enabled = true;

        this.shopExit.transform.rotation = 90;

        if (this.levelTransferProperties.enemies.length == 0)
        {
            this.levelTransferProperties.enemies = [[new Vector2(96, 240), true], [new Vector2(160, 240), true], [new Vector2(32, 16), true], [new Vector2(224, 16), true]];
        }

        if (!this.levelTransferProperties.clear)
        {
            for (let i = 0; i < 2; i++)
            {
                if (this.levelTransferProperties.enemies[i][1]) 
                {
                    const _enemy = new RangedEnemy(this, i);

                    _enemy.transform.position = this.levelTransferProperties.enemies[i][0];
                }
            }

            for (let i = 2; i < 4; i++)
            {
                if (this.levelTransferProperties.enemies[i][1]) 
                {
                    const _enemy = new Enemy(this, i);

                    _enemy.transform.position = this.levelTransferProperties.enemies[i][0];
                }
            }

            let _tmp = 0;

            for (let i = 0; i < this.levelTransferProperties.enemies.length; i++)
            {
                if (this.levelTransferProperties.enemies[i][1]) { _tmp += 1; }
            }

            this.enemyCounter = _tmp;
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
    }
}