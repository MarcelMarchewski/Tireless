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
    LevelSwapper,
    Key
} from "/source/tireless/logic/interactables.js";

import
{
    WorldCollider,
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
    Alleyway
} from "/source/tireless/scenes/alleyway.js";

import
{
    Junction
} from "/source/tireless/scenes/junction.js";

export class Courtyard extends Scene
{
    constructor()
    {
        super("Courtyard");

        if (Engine.I.persistentScene.courtyardLevelTransferProperties == undefined)
        {
            Engine.I.persistentScene.courtyardLevelTransferProperties = new GameObject(Engine.I.persistentScene, "CourtyardLevelTransferProperties").AddComponent(LevelTransferProperties);
        }

        this.levelTransferProperties = Engine.I.persistentScene.courtyardLevelTransferProperties;

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
        this.backgroundRenderer = new GameObject(this, "Background Renderer").AddComponent(TilemapRenderer, new Sprite(this.backgroundTexture, undefined, undefined, new Vector2(32, 32)), "source/tireless/resources/data/tilemaps/courtyard.json");
        this.backgroundRenderer.gameObject.transform.localPosition = new Vector2(128, 128);

        this.foregroundRenderer = new GameObject(this, "Foreground Renderer").AddComponent(TilemapRenderer, new Sprite(this.foregroundTexture, undefined, undefined, new Vector2(32, 32)), "source/tireless/resources/data/tilemaps/courtyardProps.json");
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

        this.tlBuildingCol = new GameObject(this, "TLBuildingCol").AddComponent(WorldCollider, new Vector2(128, 128));
        this.blBuildingCol = new GameObject(this, "BLBuildingCol").AddComponent(WorldCollider, new Vector2(128, 128));

        this.leftWallCol.gameObject.transform.position = new Vector2(-16, 128);
        this.rightWallCol.gameObject.transform.position = new Vector2(256, 128);

        this.topWallCol.gameObject.transform.position = new Vector2(128, 256);
        this.bottomWallCol.gameObject.transform.position = new Vector2(128, 0);

        this.tlBuildingCol.gameObject.transform.position = new Vector2(0, 256);
        this.blBuildingCol.gameObject.transform.position = new Vector2(0, 0);

        this.junctionExit = new LevelSwapper(this, new Vector2(16, 16), () => { Engine.I.persistentScene.transferProperties.health = this.player.controller.health; Engine.I.persistentScene.transferProperties.position = new Vector2(208, 128); let _fader = new LevelTransitionFader(this, () => { Engine.I.LoadScene(new LevelTransition("Junction", Junction)); }); this.player.controller.UnbindListeners(); });
        this.junctionExit.transform.position = new Vector2(16, 128);

        this.junctionExit.unlockedObject.transform.rotation = 90;

        this.junctionExit.renderer.enabled = false;
        this.junctionExit.unlockedObject.renderer.enabled = true;

        if (Engine.I.persistentScene.transferProperties.keys[0] == false)
        {
            const _key = new Key(this, 0);
            _key.transform.position = new Vector2(196, 128);
        }

        if (this.levelTransferProperties.enemies.length == 0)
        {
            this.levelTransferProperties.enemies = [[new Vector2(128, 224), true], [new Vector2(128, 32), true], [new Vector2(160, 224), true], [new Vector2(160, 32), true]];
        }

        if (!this.levelTransferProperties.clear)
        {
            for (let i = 0; i < 4; i++)
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