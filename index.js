const express = require('express');
const app = express();
const port = process.env.PORT;
const ytdl = require('ytdl-core');
const fluent = require('fluent-ffmpeg')
const route = require('./routes/routes')
const cors = require('cors');
const nodei3 = require('node-id3').Promise
const fs = require('fs');

app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'https://ytdownmike.netlify.app/');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use('/descargas', route)

app.get('/', (req, res) => {
    console.log(process.env)
    console.log(__dirname)
    console.log('hola')
    res.send('ok')
})


app.post('/', cors({ origin: 'https://ytdownmike.netlify.app/' }), (req, res, next) => {
    let link = req.body.link
    const info = ytdl.getInfo(link).then(info => {
        let musica = {
            autor: {
                autor: info.videoDetails.media.artist ? info.videoDetails.media.artist : info.videoDetails.author.name,
                icono: info.videoDetails.thumbnails[0].url,
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
        console.log(titulo)
        fluent.setFfmpegPath('./vendor/ffmpeg');
        let m = fs.createWriteStream(titulo + '0.mp3')
        ytdl(link, { filter: 'audioonly' }).pipe(m)
        m.on('finish', () => {
            fluent().input(titulo + '0.mp3').
                toFormat('mp3').
                audioBitrate('128k').
                audioCodec('libmp3lame').
                save(titulo + '.mp3').
                on('end', () => {
                    nodei3.update(
                        {
                            PIC: titulo + '.png',
                            APIC: titulo + '.png',
                            album: musica.autor.autor,
                            trackNumber: musica.video.likes,
                            originalYear: musica.video.year.substring(0, 4),
                            artist: musica.autor.extra.name,
                            genre: musica.autor.autor,
                            composer: musica.autor.autor,
                            originalArtist: musica.video.media.artist,
                            artistUrl: musica.autor.canal,
                            copyright: musica.video.media.licensed_by,
                            remixArtist: musica.video.media.artist,
                            audioSourceUrl: link,
                            conductor: musica.video.media.album,
                            year: musica.video.year,
                            date: Date.now()

                        },
                        titulo + '.mp3'
                    ).then(() => {


                        res.download(titulo + '.mp3')
                        setTimeout(() => {
                            fs.rm(titulo + '.mp3', (err => {
                                if (err) throw err
                            }))
                            fs.rm(titulo + '.webp', (err => {
                                if (err) throw err
                            }))
                            fs.rm(titulo + '.png', (err => {
                                if (err) throw err
                            }))
                            fs.rm(titulo + '0.mp3', (err => {
                                if (err) throw err
                            }))
                        }, 5000)
                    })
                })

        })


    }
    )



}, () => {

})


app.listen(port, () => console.log(`Escuchando ${port}!`))