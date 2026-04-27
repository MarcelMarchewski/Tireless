import 
{
    Vector2,
    AABB,
    Component,
    Engine
} from "/source/engine/rebound.js";

import
{
    SplashScreen
} from "/source/tireless/scenes/splashScreen.js";

export class TransferProperties extends Component
{
    constructor(gameObject, position, health)
    {
        super(gameObject);

        this.position = position;
        this.health = health;
    }
}

export class LevelTransferProperties extends TransferProperties
{
    constructor(gameObject, clear)
    {
        super(gameObject, undefined, undefined);

        this.clear = clear;
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

    _playButton.remove();
}