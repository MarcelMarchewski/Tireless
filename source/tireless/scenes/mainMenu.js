import 
{
    UIElement,
    Component,
    GameObject,
    Scene,
    SpriteRenderer,
    Sprite,
    Animator,
    AnimationClip,
    UICanvas,
    TextRenderer,
    TextData,
    Vector2,
    Engine,
    AudioPlayer
} from "/source/engine/rebound.js";

import
{
    Gym
} from "/source/tireless/scenes/gym.js";

import
{
    Alleyway
} from "/source/tireless/scenes/alleyway.js";

import
{
    LevelTransition,
    LevelTransitionFader
} from "/source/tireless/scenes/levelTransition.js";

class EntityToggleButton extends UIElement
{
    constructor(gameObject, canvas, animator, textData=new TextData("UI ELEMENT", "8px VCR_OSD_MONO", "white", undefined, undefined, Engine.I.UI_TEXT_DEFAULT_LAYER), width=32, height=32, sfx=["source/tireless/resources/audio/UI/Tireless_SFX_UISwap.wav", "source/tireless/resources/audio/UI/Tireless_SFX_UIPressDown.wav", "source/tireless/resources/audio/UI/Tireless_SFX_UIPressUp.wav"], interactable=true)
    {   
        super(gameObject, canvas, animator, textData, width, height, sfx, interactable);

        this.targets = [];
    }

    OnUIClickEnd()
    {
        for (let i = 0; i < this.targets.length; i++)
        {
            this.targets[i].enabled = !this.targets[i].enabled;
        }
    }
}

class SwapButton extends UIElement
{
    constructor(gameObject, canvas, animator, textData=new TextData("UI ELEMENT", "8px VCR_OSD_MONO", "white", undefined, undefined, Engine.I.UI_TEXT_DEFAULT_LAYER), width=32, height=32, sfx=["source/tireless/resources/audio/UI/Tireless_SFX_UISwap.wav", "source/tireless/resources/audio/UI/Tireless_SFX_UIPressDown.wav", "source/tireless/resources/audio/UI/Tireless_SFX_UIPressUp.wav"], interactable=true)
    {   
        super(gameObject, canvas, animator, textData, width, height, sfx, interactable);
    }

    OnUIClickEnd()
    {
        this.gameObject.scene.musicPlayer.onEnded = null;
        
        this.gameObject.scene.OnSwapButton();
    }
}

class AudioVolumeButton extends UIElement
{
    constructor(gameObject, canvas, animator, mixer, valueChange=0.1, text=undefined, width=32, height=32, sfx=["source/tireless/resources/audio/UI/Tireless_SFX_UISwap.wav", "source/tireless/resources/audio/UI/Tireless_SFX_UIPressDown.wav", "source/tireless/resources/audio/UI/Tireless_SFX_UIPressUp.wav"], interactable=true)
    {
        super(gameObject, canvas, animator, text, width, height, sfx, interactable);

        this.mixer = mixer;
        this.valueChange = valueChange;

        this.targets = [];
    }

    Start()
    {
        super.Start();

        for (let i = 0; i < this.targets.length; i++)
        {
            this.targets[i].OnMixerValueChange(this.mixer);
        }
    }

    OnEnable()
    {
        super.OnEnable();

        for (let i = 0; i < this.targets.length; i++)
        {
            this.targets[i].OnMixerValueChange(this.mixer);
        }
    }

    OnUIClickEnd()
    {
        this.mixer.volume += this.valueChange;

        if (this.mixer.volume > 1)
        {
            this.mixer.volume = 1;
        }

        else if (this.mixer.volume < 0)
        {
            this.mixer.volume = 0;
        }

        for (let i = 0; i < this.targets.length; i++)
        {
            this.targets[i].OnMixerValueChange(this.mixer);
        }
    }
}

class AudioIconAnimator extends Component
{
    constructor(gameObject)
    {
        super(gameObject);
    }

    OnMixerValueChange(_mixer)
    {
        if (_mixer.muted)
        {
            this.gameObject.animator.JumpToFrame(6);
            return;
        }

        if (_mixer.localVolumePure >= 1)
        {
            this.gameObject.animator.JumpToFrame(0);
        }

        else if (_mixer.localVolumePure >= 0.8)
        {
            this.gameObject.animator.JumpToFrame(1);
        }

        else if (_mixer.localVolumePure >= 0.5)
        {
            this.gameObject.animator.JumpToFrame(2);
        }

        else if (_mixer.localVolumePure >= 0.3)
        {
            this.gameObject.animator.JumpToFrame(3);
        }

        else if (_mixer.localVolumePure >= 0.1)
        {
            this.gameObject.animator.JumpToFrame(4);
        }   

        else
        {
            this.gameObject.animator.JumpToFrame(5);
        }
    }
}

class AudioPlusButton extends GameObject
{
    constructor(scene, mixer, canvasObject, name="Audio Plus Button", parent=null)
    {
        super(scene, name, parent);

        this.renderer = this.AddComponent(SpriteRenderer, new Sprite(this.scene.plusButtonTexture, Engine.I.UI_DEFAULT_LAYER, undefined, new Vector2(32, 32)));
        this.animator = this.AddComponent(Animator, this.renderer, 4, [this.scene.buttonAnimationClip]);

        this.volumeButton = this.AddComponent(AudioVolumeButton, canvasObject.GetComponent(UICanvas), this.animator, mixer, 0.1);
    }
}

class AudioMinusButton extends GameObject
{
    constructor(scene, mixer, canvasObject, name="Audio Minus Button", parent=null)
    {
        super(scene, name, parent);

        this.renderer = this.AddComponent(SpriteRenderer, new Sprite(this.scene.minusButtonTexture, Engine.I.UI_DEFAULT_LAYER, undefined, new Vector2(32, 32)));
        this.animator = this.AddComponent(Animator, this.renderer, 4, [this.scene.buttonAnimationClip]);

        this.volumeButton = this.AddComponent(AudioVolumeButton, canvasObject.GetComponent(UICanvas), this.animator, mixer, -0.1);
    }
}

class AudioIcon extends GameObject
{
    constructor(scene, name="Audio Icon", parent=null)
    {
        super(scene, name, parent);

        this.renderer = this.AddComponent(SpriteRenderer, new Sprite(this.scene.audioIconTexture, Engine.I.UI_DEFAULT_LAYER, undefined, new Vector2(32, 32)));
        this.animator = this.AddComponent(Animator, this.renderer, 7, [this.scene.audioIconAnimationClip]);

        this.iconAnimator = this.AddComponent(AudioIconAnimator);
    }
}

class MediaController extends GameObject
{
    constructor(scene, mixer, canvasObject, text="MEDIA VOLUME", name="Media Controller", parent=null)
    {
        super(scene, name, parent);

        this.mediaText = new GameObject(this.scene, "Media Text", this.transform).AddComponent(TextRenderer, new TextData(text, "8px VCR_OSD_MONO", "white"));

        this.mediaIcon = new AudioIcon(this.scene, undefined, this.transform);
        this.mediaIcon.transform.localPosition = new Vector2(-32, -24);

        this.mediaPlusButton = new AudioPlusButton(this.scene, mixer, canvasObject, undefined, this.transform);
        this.mediaPlusButton.transform.localPosition = new Vector2(0, -24);

        this.mediaPlusButton.volumeButton.targets = [this.mediaIcon.iconAnimator];

        this.mediaMinusButton = new AudioMinusButton(this.scene, mixer, canvasObject, undefined, this.transform);
        this.mediaMinusButton.transform.localPosition = new Vector2(32, -24);

        this.mediaMinusButton.volumeButton.targets = [this.mediaIcon.iconAnimator];
    }
}

class SettingsMenuCanvas extends GameObject
{
    constructor(scene, name="Settings Menu Canvas", parent=null)
    {
        super(scene, name, parent);

        this.canvas = this.AddComponent(UICanvas);

        this.logoRenderer = new GameObject(this.scene, "Logo Renderer", this.transform).AddComponent(SpriteRenderer, new Sprite(this.scene.settingsLogoTexture, 1, undefined, new Vector2(96, 32)));
        this.logoAnimator = this.logoRenderer.gameObject.AddComponent(Animator, this.logoRenderer, 2);

        this.logoRenderer.gameObject.transform.localPosition = new Vector2(128, 180);
        this.logoRenderer.gameObject.transform.localScale = new Vector2(2, 2);

        this.backButton = new NextCanvasButton(this.scene, this, new Vector2(128, 32), "Back Button", "BACK", this.transform);

        this.musicController = new MediaController(this.scene, Engine.I.musicMixer, this, "MUSIC VOLUME", "Music Controller", this.transform);
        this.musicController.transform.localPosition = new Vector2(64, 144);

        this.sfxController = new MediaController(this.scene, Engine.I.sfxMixer, this, "SFX VOLUME", "SFX Controller", this.transform);
        this.sfxController.transform.localPosition = new Vector2(192, 144);
    }
}

class MainMenuCanvas extends GameObject
{
    constructor(scene, name="Main Menu Canvas", parent=null)
    {
        super(scene, name, parent);

        this.canvas = this.AddComponent(UICanvas);

        this.logoRenderer = new GameObject(this.scene, "Logo Renderer", this.transform).AddComponent(SpriteRenderer, new Sprite(this.scene.logoTexture, 1, undefined, new Vector2(96, 32)));
        this.logoAnimator = this.logoRenderer.gameObject.AddComponent(Animator, this.logoRenderer, 9);

        this.logoRenderer.gameObject.transform.localPosition = new Vector2(128, 180);
        this.logoRenderer.gameObject.transform.localScale = new Vector2(2, 2);

        this.playButton = new PlayButton(this.scene, this, new Vector2(128, 142), undefined, undefined, this.transform);

        this.settingsButton = new NextCanvasButton(this.scene, this, new Vector2(128, 102), "Settings Button", "SETTINGS", this.transform);
    }
}

class PlayButton extends GameObject
{
    constructor(scene, currentCanvasObject, localPosition, name="Play Button", text="PLAY", parent=null)
    {
        super(scene, name, parent);

        this.transform.localPosition = localPosition;

        this.renderer = this.AddComponent(SpriteRenderer, new Sprite(this.scene.uiButtonTexture, Engine.I.UI_DEFAULT_LAYER, undefined, new Vector2(64, 32)));
        this.animator = this.AddComponent(Animator, this.renderer, 4, [this.scene.buttonAnimationClip]);
        
        this.sceneSwapper = this.AddComponent(SwapButton, currentCanvasObject.GetComponent(UICanvas), this.animator, new TextData(text, "8px VCR_OSD_MONO", "white", undefined, undefined, Engine.I.UI_TEXT_DEFAULT_LAYER), 64, 32);
    }
}

class NextCanvasButton extends GameObject
{
    constructor(scene, currentCanvasObject, localPosition, name="Next Canvas Button", text="NEXT CANVAS", parent=null)
    {
        super(scene, name, parent);

        this.transform.localPosition = localPosition;

        this.renderer = this.AddComponent(SpriteRenderer, new Sprite(this.scene.uiButtonTexture, Engine.I.UI_DEFAULT_LAYER, undefined, new Vector2(64, 32)));
        this.animator = this.AddComponent(Animator, this.renderer, 4, [this.scene.buttonAnimationClip]);
        
        this.toggle = this.AddComponent(EntityToggleButton, currentCanvasObject.GetComponent(UICanvas), this.animator, new TextData(text, "8px VCR_OSD_MONO", "white", undefined, undefined, Engine.I.UI_TEXT_DEFAULT_LAYER), 64, 32);
    }
}

export class MainMenu extends Scene
{
    constructor()
    {
        super("Main Menu");

        Engine.I.menuBar.style.display = "";
        Engine.I.controlsBar.style.display = "";

        Engine.I.loadButton.style.display = "";

        this.backgroundTexture = new Image();
        this.backgroundTexture.src = "source/tireless/resources/textures/MainMenu/tirelessTitleBackground.png";

        this.logoTexture = new Image();
        this.logoTexture.src = "source/tireless/resources/textures/MainMenu/tirelessTitle.png";

        this.settingsLogoTexture = new Image();
        this.settingsLogoTexture.src = "source/tireless/resources/textures/MainMenu/tirelessSettingsLogo.png";

        this.uiButtonTexture = new Image();
        this.uiButtonTexture.src = "source/tireless/resources/textures/UI/tirelessButtonPrefab.png";

        this.audioIconTexture = new Image();
        this.audioIconTexture.src = "source/tireless/resources/textures/UI/tirelessAudioIcon.png";

        this.plusButtonTexture = new Image();
        this.plusButtonTexture.src = "source/tireless/resources/textures/UI/tirelessPlusButton.png";

        this.minusButtonTexture = new Image();
        this.minusButtonTexture.src = "source/tireless/resources/textures/UI/tirelessMinusButton.png";

        this.buttonAnimationClip = new AnimationClip("ButtonAnimation", 0, 3, 0, false, false);
        this.audioIconAnimationClip = new AnimationClip("AudioIconAnimation", 0, 6, 0, false, false);
    }

    SetupButtonTargets()
    {
        this.mainMenuCanvas.settingsButton.toggle.targets = [this.mainMenuCanvas, this.settingsMenuCanvas];

        this.settingsMenuCanvas.backButton.toggle.targets = [this.settingsMenuCanvas, this.mainMenuCanvas];
    }

    Start()
    {
        this.backgroundRenderer = new GameObject(this, "Background Renderer").AddComponent(SpriteRenderer, new Sprite(this.backgroundTexture, 0));
        this.backgroundRenderer.gameObject.transform.localPosition = new Vector2(128, 128);

        this.settingsMenuCanvas = new SettingsMenuCanvas(this);
        this.settingsMenuCanvas.enabled = false;

        this.mainMenuCanvas = new MainMenuCanvas(this);

        this.SetupButtonTargets();

        Engine.I.musicMixer.volumeInitial = 0.7;

        this.musicPlayer = new GameObject(this, "Music Player").AddComponent(AudioPlayer, "source/tireless/resources/audio/MainMenu/Tireless_MenuTheme_IntroStem.wav", Engine.I.musicMixer, 1, false, true);

        this.musicPlayer.onEnded = () => 
        {
            this.musicPlayer.SetFile("source/tireless/resources/audio/MainMenu/Tireless_MenuTheme.wav");
            this.musicPlayer.loop = true;
            this.musicPlayer.Play();

            this.musicPlayer.onEnded = null;
        }

        this.musicPlayer.Play();
    }

    OnSwapButton()
    {
        let _fader = new LevelTransitionFader(this, () => { Engine.I.LoadScene(new LevelTransition("Alleyway", Alleyway)); });
    }
}