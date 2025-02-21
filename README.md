# Radxa CM5 Implementation

_Due to limited VRAM capacity on the Raspberry Pi 5 mode at 8GB, the current implementation of the project is shifted to the Radxa CM5 model at 16GB VRAM. The shift allows for usage of more sophisticated (consequently better and larger sized) speech to text models.
Several potential speech to text models are currently being considered with Vosk being the most promising based on the testing results of its performance on the Pi5. However, due to the increased in hardware capabilities being offered by the Radxa Cm5, larger models that were previously un able to run will be consider._


This document goes over the step by step guide to run the algorithms on the radxa CM5 terminal.


## Vosk Model

**1) Navigate to the dictory:  _/home/radxa/dev/_ .**
  
> This directories contain the virtual environment requires to run the model, the several Vosk model of different sizes and the python script that runs the atual model - _my_vosk_script.py_

**2) Create the virtual environment to run the alorithm : _python3 -m venv vosk-env_**

> The algorithm will NOT run if the virtual environment is not initializes before hand, To deactivate it, simply type : 
> _deactivate_ 
> in the terminal. Another method was tried to install the depencies using pipx but it can't seem to be working right now. The final implementation might be modified so a virtual environment won't have to be declared.

**3) Activate the virtual environment: _source vosk-env/bin/activate_**

> The terminal print line should change to sth along the line of: <br>
> _(vosk-env) radxa@radxa-cm5-io:~/dev$_

**4) Run : _python3 my_vosk_script.py_**

> This runs the scripts that points to the model that you want to run.
> Within the script, the line: <br> 
> `model = Model(r"/home/radxa/dev/vosk-model-en-us-0.22/")` <br> points to the diectory of the speech to text model that you want to run. Change it to point to another Vosk model when needed.
> In the first testing, a USB microphone was used to capture noise, this is reflected in the line: <br>
> `stream = mic.open(format=pyaudio.paInt16,channels=1,rate=16000,input=True,frames_per_buffer=256)` <br>
> When using a different microphone input as in the case with the glasses microphone, this will needs to be change




