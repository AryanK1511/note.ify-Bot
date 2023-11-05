import sounddevice as sd
from scipy.io.wavfile import write
import wavio as wv

# Sampling frequency and duration
freq = 16000
duration = 45

print("shdfuiehu")

# Start recorder with the given values of duration and sample frequencxy
recording = sd.rec(int(duration * freq), samplerate=freq, channels=1)

# Record audio for the given number of seconds
sd.wait()

# Convert the NumPy array to audio file
wv.write("recording1.wav", recording, freq, sampwidth=2) # 2 bytes per sample