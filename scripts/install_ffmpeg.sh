#!/bin/sh
yum -y install wget xz

cd /usr/local/bin
mkdir ffmpeg

cd ffmpeg
wget https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz
tar -xvf ffmpeg-release-amd64-static.tar.xz
mv ffmpeg-release-amd64-static/ffmpeg .

ln -s /usr/local/bin/ffmpeg/ffmpeg /usr/bin/ffmpeg

ffmpeg -version
