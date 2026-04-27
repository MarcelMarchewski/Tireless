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
    Enemy
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

export class Alleyway extends Scene
{
    constructor()
    {
        super("Alleyway");

        if (Engine.I.persistentScene.transferProperties == undefined)
        {
            Engine.I.persistentScene.transferProperties = new GameObject(Engine.I.persistentScene, "TransferProperties").AddComponent(TransferProperties, new Vector2(72, 128), 100);
        }

        if (Engine.I.persistentScene.alleywayLevelTransferProperties == undefined)
        {
            Engine.I.persistentScene.alleywayLevelTransferProperties = new GameObject(Engine.I.persistentScene, "AlleywayLevelTransferProperties").AddComponent(LevelTransferProperties, false);
        }

        this.levelTransferProperties = Engine.I.persistentScene.alleywayLevelTransferProperties;

        this.playerTexture = new Image();
        this.playerTexture.src = "source/tireless/resources/textures/Shared/tirelessPlayerSamurai.png";

        this.enemyTexture = new Image();
        this.enemyTexture.src = "source/tireless/resources/textures/Shared/tirelessEnemySamurai.png";

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
        this.backgroundRenderer = new GameObject(this, "Background Renderer").AddComponent(TilemapRenderer, new Sprite(this.backgroundTexture, undefined, undefined, new Vector2(32, 32)), "source/tireless/resources/data/tilemaps/alleyway.json");
        this.backgroundRenderer.gameObject.transform.localPosition = new Vector2(128, 128);

        this.foregroundRenderer = new GameObject(this, "Foreground Renderer").AddComponent(TilemapRenderer, new Sprite(this.foregroundTexture, undefined, undefined, new Vector2(32, 32)), "source/tireless/resources/data/tilemaps/alleywayProps.json");
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

        this.leftWallCol.gameObject.transform.position = new Vector2(32, 128);
        this.rightWallCol.gameObject.transform.position = new Vector2(272, 128);

        this.topWallCol.gameObject.transform.position = new Vector2(128, 212);
        this.bottomWallCol.gameObject.transform.position = new Vector2(128, 48);

        this.exit = new LevelSwapper(this, new Vector2(16, 16), () => { Engine.I.persistentScene.transferProperties.health = this.player.controller.health; Engine.I.persistentScene.transferProperties.position = new Vector2(48, 128); let _fader = new LevelTransitionFader(this, () => { Engine.I.LoadScene(new LevelTransition("Junction", Junction)); }); this.player.controller.UnbindListeners(); });
        this.exit.transform.position = new Vector2(240, 128);

        this.exit.unlockedObject.transform.rotation = -90;

        this.player.controller.health = Engine.I.persistentScene.transferProperties.health;

        if (!this.levelTransferProperties.clear)
        {
            const _enemy = new Enemy(this);
            _enemy.transform.position = new Vector2(196, 128);

            this.enemyCounter = 1;
        }

        else
        {
            this.enemyCounter = 0;

            this.exit.renderer.enabled = false;

            this.exit.unlockedObject.renderer.enabled = true;
        }

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
            this.exit.renderer.enabled = false;

            this.exit.unlockedObject.renderer.enabled = true;

            this.levelTransferProperties.clear = true;
        }
    }
}