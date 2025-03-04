import { writable } from 'svelte/store';

export const isRecording = writable(false);

export const toggleRecording = () => {
    isRecording.update(value => !value);
};

export const setRecording = (value) => {
    isRecording.set(value);
};