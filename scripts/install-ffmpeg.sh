#!/bin/bash
yum update -y && yum install -y xz

# Create a directory for FFmpeg
mkdir -p $PWD/bin

# Download FFmpeg
curl -L https://ffmpeg.org/releases/ffmpeg-6.1.tar.xz | tar xz -C $PWD/bin --strip-components=1

# Make binaries executable
chmod +x $PWD/bin/*

# Optionally, add the binaries to the PATH
export PATH=$PWD/bin:$PATH

ffmpeg -version