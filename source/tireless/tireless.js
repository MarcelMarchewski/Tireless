import 
{
    Vector2,
    AABB,
    GameObject,
    Component,
    Engine
} from "/source/engine/rebound.js";

import
{
    SplashScreen
} from "/source/tireless/scenes/splashScreen.js";

export class TransferProperties extends Component
{
    constructor(gameObject, position, health, keys=[false, false])
    {
        super(gameObject);

        this.position = position;
        this.health = health;

        this.keys = keys;

        this.score = 0;

        this.playerHasGun = false;

        this.gameComplete = false;
    }
}

export class LevelTransferProperties extends TransferProperties
{
    constructor(gameObject, enemies=[])
    {
        super(gameObject, undefined, undefined);

        this.enemies = enemies;
    }

    get clear()
    {
        for (let i = 0; i < this.enemies.length; i++)
        {
            if (this.enemies[i][1]) { return false; }
        }

        return true;
    }
}

export class WorldCollider extends AABB
{
    constructor(gameObject, dimensions)
    {
        super(gameObject, dimensions);
    }
}

export class WaterCollider extends AABB
{
    constructor(gameObject, dimensions)
    {
        super(gameObject, dimensions);
    }
}

export class PlayerOnlyCollider extends AABB
{
    constructor(gameObject, dimensions)
    {
        super(gameObject, dimensions);
    }
}

const _playButton = document.getElementById("playButton");

const _baseWidth = 256;
const _baseHeight = 256;

_playButton.onclick = () =>
{
    const _startScene = new SplashScreen();

    const _scale = Math.floor(Math.min(window.innerWidth / _baseWidth, window.innerHeight / _baseHeight));

    new Engine(256, 256, new Vector2(_scale, _scale), false, "10px solid white");

    Engine.I.LoadScene(_startScene);

    Engine.I.menuBar = document.getElementById("leftSideBar");

    Engine.I.saveButton = document.getElementById("saveButton");
    Engine.I.loadButton = document.getElementById("loadButton");

    _playButton.remove();
}

const _saveButton = document.getElementById("saveButton");

_saveButton.onclick = () => 
{
    if (Engine.I == undefined) { return; }

    const _tp = Engine.I.persistentScene.transferProperties;

    if (_tp == undefined) { return; }

    const _altp = Engine.I.persistentScene.alleywayLevelTransferProperties;
    const _jtp = Engine.I.persistentScene.junctionLevelTransferProperties;

    const _ttp = Engine.I.persistentScene.townLevelTransferProperties;
    const _stp = Engine.I.persistentScene.shopLevelTransferProperties;

    const _ptp = Engine.I.persistentScene.parkLevelTransferProperties;

    const _ctp = Engine.I.persistentScene.courtyardLevelTransferProperties;

    const _dtp = Engine.I.persistentScene.dojoLevelTransferProperties;

    const _data = 
    {
        transferProperties: 
        {
            position: _tp.position,
            health: _tp.health,

            keys: _tp.keys,

            score: _tp.score,

            playerHasGun: _tp.playerHasGun,

            gameComplete: _tp.gameComplete
        }
    }

    if (_altp != undefined)
    {
        _data["alleywayLevelTransferProperties"] = 
        {
            enemies: _altp.enemies
        }
    }

    if (_jtp != undefined)
    {
        _data["junctionLevelTransferProperties"] = 
        {
            enemies: _jtp.enemies,

            healthBoxUsed: _jtp.healthBoxUsed
        }
    }

    if (_ttp != undefined)
    {
        _data["townLevelTransferProperties"] = 
        {
            enemies: _ttp.enemies,

            healthBoxUsed: _ttp.healthBoxUsed
        }
    }

    if (_stp != undefined)
    {
        _data["shopLevelTransferProperties"] = 
        {
            enemies: _stp.enemies,

            healthBoxUsed: _stp.healthBoxUsed
        }
    }

    if (_ptp != undefined)
    {
        _data["parkLevelTransferProperties"] = 
        {
            enemies: _ptp.enemies,

            healthBoxUsed: _ptp.healthBoxUsed
        }
    }

    if (_ctp != undefined)
    {
        _data["courtyardLevelTransferProperties"] = 
        {
            enemies: _ctp.enemies,

            healthBoxUsed: _ctp.healthBoxUsed
        }
    }

    if (_dtp != undefined)
    {
        _data["dojoLevelTransferProperties"] = 
        {
            enemies: _dtp.enemies,

            healthBoxUsed: _dtp.healthBoxUsed
        }
    }

    const _blob = new Blob([JSON.stringify(_data)], { type: "application/json" });
    const _url = URL.createObjectURL(_blob);

    const _anchor = document.createElement("a");

    _anchor.href = _url;
    _anchor.download = "tirelessSaveFile_" + Date.now() + ".json";

    document.body.appendChild(_anchor);

    _anchor.click();
    _anchor.remove();
}

const _loadButton = document.getElementById("loadButton");

_loadButton.onclick = () => 
{
    const _input = document.getElementById("loadInput");

    _input.onchange = () => 
    {
        if (_input.files.length <= 0) { return; }

        let _fileReader = new FileReader();

        _fileReader.onload = (_event) => 
        {
            const _data = JSON.parse(_event.target.result);

            Engine.I.persistentScene.transferProperties = new GameObject(Engine.I.persistentScene, "TransferProperties").AddComponent(TransferProperties, new Vector2(72, 128), _data.transferProperties.health, _data.transferProperties.keys);

            Engine.I.persistentScene.transferProperties.score = _data.transferProperties.score;
            Engine.I.persistentScene.transferProperties.playerHasGun = _data.transferProperties.playerHasGun;
            Engine.I.persistentScene.transferProperties.gameComplete = _data.transferProperties.gameComplete;

            if (_data.alleywayLevelTransferProperties != undefined)
            {
                Engine.I.persistentScene.alleywayLevelTransferProperties = new GameObject(Engine.I.persistentScene, "AlleywayLevelTransferProperties").AddComponent(LevelTransferProperties);

                Engine.I.persistentScene.alleywayLevelTransferProperties.enemies = _data.alleywayLevelTransferProperties.enemies;
                Engine.I.persistentScene.alleywayLevelTransferProperties.healthBoxUsed = _data.alleywayLevelTransferProperties.healthBoxUsed;
            }

            if (_data.junctionLevelTransferProperties != undefined)
            {
                Engine.I.persistentScene.junctionLevelTransferProperties = new GameObject(Engine.I.persistentScene, "JunctionLevelTransferProperties").AddComponent(LevelTransferProperties);

                Engine.I.persistentScene.junctionLevelTransferProperties.enemies = _data.junctionLevelTransferProperties.enemies;
                Engine.I.persistentScene.junctionLevelTransferProperties.healthBoxUsed = _data.junctionLevelTransferProperties.healthBoxUsed;
            }

            if (_data.townLevelTransferProperties != undefined)
            {
                Engine.I.persistentScene.townLevelTransferProperties = new GameObject(Engine.I.persistentScene, "TownLevelTransferProperties").AddComponent(LevelTransferProperties);

                Engine.I.persistentScene.townLevelTransferProperties.enemies = _data.townLevelTransferProperties.enemies;
                Engine.I.persistentScene.townLevelTransferProperties.healthBoxUsed = _data.townLevelTransferProperties.healthBoxUsed;
            }

            if (_data.shopLevelTransferProperties != undefined)
            {
                Engine.I.persistentScene.shopLevelTransferProperties = new GameObject(Engine.I.persistentScene, "ShopLevelTransferProperties").AddComponent(LevelTransferProperties);

                Engine.I.persistentScene.shopLevelTransferProperties.enemies = _data.shopLevelTransferProperties.enemies;
                Engine.I.persistentScene.shopLevelTransferProperties.healthBoxUsed = _data.shopLevelTransferProperties.healthBoxUsed;
            }

            if (_data.parkLevelTransferProperties != undefined)
            {
                Engine.I.persistentScene.parkLevelTransferProperties = new GameObject(Engine.I.persistentScene, "ParkLevelTransferProperties").AddComponent(LevelTransferProperties);

                Engine.I.persistentScene.parkLevelTransferProperties.enemies = _data.parkLevelTransferProperties.enemies;
                Engine.I.persistentScene.parkLevelTransferProperties.healthBoxUsed = _data.parkLevelTransferProperties.healthBoxUsed;
            }

            if (_data.courtyardLevelTransferProperties != undefined)
            {
                Engine.I.persistentScene.courtyardLevelTransferProperties = new GameObject(Engine.I.persistentScene, "CourtyardLevelTransferProperties").AddComponent(LevelTransferProperties);

                Engine.I.persistentScene.courtyardLevelTransferProperties.enemies = _data.courtyardLevelTransferProperties.enemies;
                Engine.I.persistentScene.courtyardLevelTransferProperties.healthBoxUsed = _data.courtyardLevelTransferProperties.healthBoxUsed;
            }

            if (_data.dojoLevelTransferProperties != undefined)
            {
                Engine.I.persistentScene.dojoLevelTransferProperties = new GameObject(Engine.I.persistentScene, "DojoLevelTransferProperties").AddComponent(LevelTransferProperties);

                Engine.I.persistentScene.dojoLevelTransferProperties.enemies = _data.dojoLevelTransferProperties.enemies;
                Engine.I.persistentScene.dojoLevelTransferProperties.healthBoxUsed = _data.dojoLevelTransferProperties.healthBoxUsed;
            }
        }

        _fileReader.readAsText(_input.files.item(0));
    }

    _input.click();
}