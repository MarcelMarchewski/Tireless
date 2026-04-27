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
    Courtyard
} from "/source/tireless/scenes/courtyard.js";

import
{
    Park
} from "/source/tireless/scenes/park.js";

export class Junction extends Scene
{
    constructor()
    {
        super("Junction");

        if (Engine.I.persistentScene.junctionTransferProperties == undefined)
        {
            Engine.I.persistentScene.junctionTransferProperties = new GameObject(Engine.I.persistentScene, "JunctionTransferProperties").AddComponent(LevelTransferProperties, false);
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
        this.backgroundRenderer = new GameObject(this, "Background Renderer").AddComponent(TilemapRenderer, new Sprite(this.backgroundTexture, undefined, undefined, new Vector2(32, 32)), "source/tireless/resources/data/tilemaps/junction.json");
        this.backgroundRenderer.gameObject.transform.localPosition = new Vector2(128, 128);

        this.foregroundRenderer = new GameObject(this, "Foreground Renderer").AddComponent(TilemapRenderer, new Sprite(this.foregroundTexture, undefined, undefined, new Vector2(32, 32)), "source/tireless/resources/data/tilemaps/junctionProps.json");
        this.foregroundRenderer.gameObject.transform.localPosition = new Vector2(128, 128);

        this.player = new Player(this);

        this.player.transform.position = Engine.I.persistentScene.transferProperties.position;

        if (!Engine.I.persistentScene.junctionTransferProperties.healthBoxUsed)
        {
            const _healthBox = new HealthBox(this, () => { Engine.I.persistentScene.junctionTransferProperties.healthBoxUsed = true; });
            _healthBox.transform.position = new Vector2(128, 128);
        }

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

        this.blBuildingCol = new GameObject(this, "BLBuildingCol").AddComponent(WorldCollider, new Vector2(128, 128));
        this.brBuildingCol = new GameObject(this, "BRBuildingCol").AddComponent(WorldCollider, new Vector2(128, 128));

        this.leftWallCol.gameObject.transform.position = new Vector2(-16, 128);
        this.rightWallCol.gameObject.transform.position = new Vector2(272, 128);

        this.topWallCol.gameObject.transform.position = new Vector2(128, 272);
        this.bottomWallCol.gameObject.transform.position = new Vector2(128, -16);

        this.tlBuildingCol.gameObject.transform.position = new Vector2(0, 256);
        this.trBuildingCol.gameObject.transform.position = new Vector2(256, 256);

        this.blBuildingCol.gameObject.transform.position = new Vector2(0, 0);
        this.brBuildingCol.gameObject.transform.position = new Vector2(256, 0);

        this.alleywayExit = new LevelSwapper(this, new Vector2(16, 16), () => { Engine.I.persistentScene.transferProperties.health = this.player.controller.health; Engine.I.persistentScene.transferProperties.position = new Vector2(208, 128); let _fader = new LevelTransitionFader(this, () => { Engine.I.LoadScene(new LevelTransition("Alleyway", Alleyway)); }); this.player.controller.UnbindListeners(); });
        this.alleywayExit.transform.position = new Vector2(16, 128);

        this.alleywayExit.unlockedObject.transform.rotation = 90;

        this.alleywayExit.renderer.enabled = false;
        this.alleywayExit.unlockedObject.renderer.enabled = true;

        this.courtyardExit = new LevelSwapper(this, new Vector2(16, 16), () => { Engine.I.persistentScene.transferProperties.health = this.player.controller.health; Engine.I.persistentScene.transferProperties.position = new Vector2(48, 128); let _fader = new LevelTransitionFader(this, () => { Engine.I.LoadScene(new LevelTransition("Courtyard", Courtyard)); }); this.player.controller.UnbindListeners(); });
        this.courtyardExit.transform.position = new Vector2(240, 128);

        this.courtyardExit.unlockedObject.transform.rotation = -90;

        this.parkExit = new LevelSwapper(this, new Vector2(16, 16), () => { Engine.I.persistentScene.transferProperties.health = this.player.controller.health; Engine.I.persistentScene.transferProperties.position = new Vector2(128, 208); let _fader = new LevelTransitionFader(this, () => { Engine.I.LoadScene(new LevelTransition("Park", Park)); }); this.player.controller.UnbindListeners(); });
        this.parkExit.transform.position = new Vector2(128, 16);

        this.parkExit.unlockedObject.transform.rotation = 180;

        this.enemies = [];

        if (!Engine.I.persistentScene.junctionTransferProperties.clear)
        {
            for (let i = 0; i < 2; i++)
            {
                const _enemy = new Enemy(this);

                this.enemies.push(_enemy);
            }

            this.enemies[0].transform.position = new Vector2(128, 228);
            this.enemies[1].transform.position = new Vector2(228, 128);

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
            this.courtyardExit.renderer.enabled = false;

            this.courtyardExit.unlockedObject.renderer.enabled = true;

            this.parkExit.renderer.enabled = false;

            this.parkExit.unlockedObject.renderer.enabled = true;

            Engine.I.persistentScene.junctionTransferProperties.clear = true;
        }
    }
}