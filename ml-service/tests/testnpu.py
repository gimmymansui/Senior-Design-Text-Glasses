import numpy as np
import tflite_runtime.interpreter as tflite

# Path to your TFLite model
model_path = "your_model.tflite"

# Try to use the NPU via Teflon delegate
try:
    # Load the Teflon delegate
    delegate = tflite.load_delegate('libteflon_delegate.so')

    # Create interpreter with delegate
    interpreter = tflite.Interpreter(
        model_path=model_path,
        experimental_delegates=[delegate]
    )
    print("Using NPU acceleration")
except Exception as e:
    print(f"Failed to use NPU: {e}")
    print("Falling back to CPU")
    interpreter = tflite.Interpreter(model_path=model_path)

# Allocate tensors
interpreter.allocate_tensors()

# Get input and output details
input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()

# Prepare input data (example)
input_shape = input_details[0]['shape']
input_data = np.array(np.random.random_sample(input_shape), dtype=np.float32)

# Set the input tensor
interpreter.set_tensor(input_details[0]['index'], input_data)

# Run inference
interpreter.invoke()

# Get the output
output_data = interpreter.get_tensor(output_details[0]['index'])
print(output_data)
