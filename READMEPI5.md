
-----------------------------------------EXPIRED MOVE TO RADXA CM5 IMPLEMENTATION -------------------------------------------------------------------------------------------------

**The code included at this point has been altered and changed to fit on the exact model of Raspberry Pi that is being used for the demo** (Raspberry Pi 5,  8 GB Vram, 64GB storage)

**The code included are not exhaustive. The folders being run on the raspberry Pi size exceeds the maximum allowed amount when uploading to Github.**

The largest model size that can be run is **medium**. (Size run-able: tiny, small, medium) 

The links to set up the algorithm on the Raspberry Pi are as follow - follow these instead if you want an easier time: 

**OpenAI Whisper:** https://www.youtube.com/watch?v=Mfbei9I8qQc

**Google Gemini API:** https://www.youtube.com/watch?v=uV6hJQcuW4w (requires internet connection)

**Vosk:** https://www.youtube.com/watch?v=yHYSwcJaw6c


**When running on the Raspberry Pi, it is neccessary to run it in a virtual environment.**

1) Remember to update the Pi itself:
  sudo apt update
  sudo apt upgrade -y

2) Install python and pip:
  sudo apt install python3 python3-pip python3-venv -y

3) Create virtual environment:
  python3 -m venv myenv

4) Activate virtual environment:
  source myenv/bin/activate

5) To deactivate it simply:
  deactivate

**This is a required step when following the tutorials in the links above !! Otherwise it won't run.**
