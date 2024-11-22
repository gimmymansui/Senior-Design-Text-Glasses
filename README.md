The code included at this point has been altered and changed to fit on the exact model of Raspberry Pi that is being used for the demo (Raspberry Pi 5 8 GB Vram, 64Gb storage)
The code included are not exhaustive as the folders being run on the raspberry Pi due to the large file size exceeding the maximum size allow when being upload.
The largest model size that can be run is medium. (Size run-able: tiny, small, medium) 

The links to set up the alogirhtms on the Raspberry Pi are as follow - follow these instead if you want an easier time: 

OpenAI Whisper: https://www.youtube.com/watch?v=Mfbei9I8qQc
Google Gemini API: https://www.youtube.com/watch?v=uV6hJQcuW4w (requires internet connection)
Vosk: https://www.youtube.com/watch?v=yHYSwcJaw6c

When running on the Raspberry Pi, it is neccessary to run it in a virtual environment.

Remember to update the Pi itself:
  sudo apt update
  sudo apt upgrade -y

Install python and pip:
  sudo apt install python3 python3-pip python3-venv -y

Create virtual environment:
  python3 -m venv myenv

Activate virtual environment:
  source myenv/bin/activate

To deactivate it simply:
  deactivate

This is a required step when following the tutorials in the links above !! Otherwise it won't run.
