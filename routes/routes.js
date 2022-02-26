const express = require("express")
const ytdl = require('ytdl-core')
const rq = require('request')
const fs = require('fs')
const yt = express.Router()
const ffmpeg = require('fluent-ffmpeg')
const { Readable, PassThrough } = require('stream')

yt.post("/", (req, res, next) => {
    let link = req.body.link
    ytdl.getInfo(link).then(info => {
        infoData = info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1].url
        let musica = {
            autor: {
                autor: info.videoDetails.media.artist ? info.videoDetails.media.artist : info.videoDetails.author.name,
                icono: info.videoDetails.author.thumbnails[0].url,
                canal: info.videoDetails.author.user_url,
                subs: info.videoDetails.author.subscriber_count,
                extra: info.videoDetails.author
            },
            video: {
                thumb: info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1].url,
                nombre: info.videoDetails.title,
                year: info.videoDetails.publishDate,
                likes: info.videoDetails.likes,
                duracion: info.videoDetails.lengthSeconds,
                media: info.videoDetails.media
            }
        }
        let titulo = ""
        musica.video.nombre.split("").map(val => {
            console.log(val)
            if (val != '"' && val != '|' && val != '[' && val != ']' && val != '/') titulo = titulo + val;
        })
        let pipe = fs.createWriteStream(titulo + '.webp')
        pipe = rq(infoData).pipe(pipe)
        pipe.on('close', () => {
            ffmpeg().setFfmpegPath(process.env.PATH).input(titulo + '.webp').saveToFile(titulo + '.png').setFfmpegPath()
            res.json(
                musica)

        })
    })
})




module.exports = yt;
