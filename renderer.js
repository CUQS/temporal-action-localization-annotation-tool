const { dialog } = require('@electron/remote');

let circle = document.querySelector('circle')
let radius = circle.r.baseVal.value
let circumference = radius * 2 * Math.PI
circle.style.strokeDasharray = `${circumference} ${circumference}`
circle.style.strokeDashoffset = `${circumference}`

function setProgress(percent) {
    const offset = circumference - percent / 100 * circumference
    circle.style.strokeDashoffset = offset
}

let thumbnails = [];

let thumbnailWidth = 158;
let thumbnailHeight = 90;
let horizontalItemCount = 5;
let verticalItemCount = 5;

let vids = []
let ann_all = {"video": [{"name": "video_name", "action": [], "duration": 0}]}
let json_root = ""
let color_now = "violet"
const color_plate = ["violet", "goldenrod", "pink", "coral", "forestgreen", "brown", "teal", "skyblue"]
let action_list = []
let action_color = []
let loading_flag = false

let cur_video_id = 0

let init = function () {
    videojs('video').ready(function() {
        let that = this;

        let videoSource = this.player_.children_[0];

        let video = $(videoSource).clone().css('display', 'none').appendTo('body')[0];

        // videojs element
        let root = $(videoSource).closest('.video-js');

        // control bar element
        let controlBar = root.find('.vjs-control-bar');

        $("#vjs-thumbnail-t").remove();
        
        // thumbnail element
        controlBar.append('<div class="vjs-thumbnail" id="vjs-thumbnail-t"></div>');

        //
        controlBar.on('mousemove', '.vjs-progress-control', function() {
            // getting time 
            let time = $(this).find('.vjs-mouse-display .vjs-time-tooltip').text();

            // 
            let temp = null;

            // format: 09
            if (/^\d+$/.test(time)) {
                // re-format to: 0:0:09
                time = '0:0:' + time;
            } 
            // format: 1:09
            else if (/^\d+:\d+$/.test(time)) {
                // re-format to: 0:1:09
                time = '0:' + time;
            }

            //
            temp = time.split(':');

            // calculating to get seconds
            time = (+temp[0]) * 60 * 60 + (+temp[1]) * 60 + (+temp[2]);

            //
            for (let item of thumbnails) {
                //
                let data = item.sec.find(x => x.index === time);

                // thumbnail found
                if (data) {
                    // getting mouse position based on "vjs-mouse-display" element
                    let position = controlBar.find('.vjs-mouse-display').position();

                    // updating thumbnail css
                    controlBar.find('.vjs-thumbnail').css({
                        'background-image': 'url(' + item.data + ')',
                        'background-position-x': data.backgroundPositionX,
                        'background-position-y': data.backgroundPositionY,
                        'left': position.left + 10,
                        'display': 'block'
                    });

                    // exit
                    return;
                }
            }
        });

        // mouse leaving the control bar
        controlBar.on('mouseout', '.vjs-progress-control', function() {
            // hidding thumbnail
            controlBar.find('.vjs-thumbnail').css('display', 'none');
        });

        video.addEventListener('loadeddata', async function() {            
            //
            video.pause();

            //
            let count = 1;

            //
            let id = 1;

            //
            let x = 0, y = 0;

            //
            let array = [];

            //
            let duration_t = parseInt(that.duration());

            //
            for (let i = 1; i <= duration_t; i++) {
                array.push(i);
            }
            setProgress(10)

            //
            let canvas;

            //
            let i, j;

            for (i = 0, j = array.length; i < j; i += horizontalItemCount) {
                //
                for (let startIndex of array.slice(i, i + horizontalItemCount)) {
                    //
                    let backgroundPositionX = x * thumbnailWidth;

                    //
                    let backgroundPositionY = y * thumbnailHeight;

                    //
                    let item = thumbnails.find(x => x.id === id);

                    if (!item) {
                        // 

                        //
                        canvas = document.createElement('canvas');

                        //
                        canvas.width = thumbnailWidth * horizontalItemCount;
                        canvas.height = thumbnailHeight * verticalItemCount;

                        //
                        thumbnails.push({
                            id: id,
                            canvas: canvas,
                            sec: [{
                                index: startIndex,
                                backgroundPositionX: -backgroundPositionX,
                                backgroundPositionY: -backgroundPositionY
                            }]
                        });
                    } else {
                        //

                        //
                        canvas = item.canvas;

                        //
                        item.sec.push({
                            index: startIndex,
                            backgroundPositionX: -backgroundPositionX,
                            backgroundPositionY: -backgroundPositionY
                        });
                    }

                    //
                    let context = canvas.getContext('2d');

                    //
                    video.currentTime = startIndex;

                    //
                    await new Promise(function(resolve) {
                        let event = function() {
                            //
                            context.drawImage(video, backgroundPositionX, backgroundPositionY, 
                                thumbnailWidth, thumbnailHeight);

                            //
                            x++;

                            // removing duplicate events
                            video.removeEventListener('canplay', event);

                            // 
                            resolve();
                        };

                        // 
                        video.addEventListener('canplay', event);
                    });


                    // 1 thumbnail is generated completely
                    count++;
                }

                // reset x coordinate
                x = 0;

                // increase y coordinate
                y++;

                // checking for overflow
                if (count > horizontalItemCount * verticalItemCount) {
                    //
                    count = 1;

                    //
                    x = 0;

                    //
                    y = 0;

                    //
                    id++;
                }

            }
            setProgress(33)

            // looping through thumbnail list to update thumbnail
            thumbnails.forEach(function(item) {
                // converting canvas to blob to get short url
                item.canvas.toBlob(blob => item.data = URL.createObjectURL(blob), 'image/jpeg');

                // deleting unused property
                delete item.canvas;
            });

            console.log('done...');
            
            duration = that.duration()
            setProgress(66)
            
            if (loading_flag) {
                load_annotation_state()
                loading_flag = false
            }
            setProgress(100)
        });

        // playing video to hit "loadeddata" event
        video.play();
    });
};

let vPlayer = null

let change_video = function (vid) {
    console.log(vid)
    vPlayer.src({type: "video/mp4", src: vid})
    thumbnails = []
    init()
    vPlayer.play()
}

function set_duration() {
    if (vPlayer) {
        duration = vPlayer.duration()
    } else {
        duration = 0
    }
}

function set_video_name(file_name) {
    document.getElementById("video_name").textContent = file_name
}

function check_change() {
    let load_name = document.getElementById("video_name").textContent
    if (cur_video_name !== load_name) {
        cur_video_name = load_name
        reset_ann()
        ann_cur_id = 0
        document.querySelectorAll('.vjs-ann-bar').forEach(e => e.remove())
        document.querySelectorAll('.ann_text').forEach(e => e.remove())
        return true
    }
    cur_video_name = load_name
    return false
}

function load_annotation_state() {
    ann_cur_id = ann_all["video"][cur_video_id]["action"].length
    ann_state = "create"
    // duration = ann_all["video"][cur_video_id]["duration"]
    let ann_i = ann_all["video"][cur_video_id]["action"]
    if (ann_i.length > 0) {
        let slider_bar = $('.vjs-play-progress.vjs-slider-bar')
        
        for (let i=0; i<ann_i.length; i++) {
            // add ann text
            let li_t = document.createElement("li")
            li_t.id = "ann_" + i
            li_t.value = i
            li_t.className = "ann_text"
            $('#ann_action').append(li_t)
            let action_t = ann_i[i]["category"]
            $('#ann_'+i).append(action_t + " : " + ann_i[i]["start"].toFixed(3) + ", " + ann_i[i]["end"].toFixed(3))
            add_ann_tool(i)
            // add ann bar
            slider_bar.append('<div class="vjs-ann-bar" onclick="select_annotation(this)" id="ann_bar_'+ i +'"></div>')
            let action_idx = get_action_idx(action_t)
            let color_t = '#4e95ff'
            if (action_idx >= 0) {
                color_t = action_color[action_idx]
            } else {
                action_list.push(action_t)
                action_idx = action_list.length - 1
                color_t = color_plate[action_idx % color_plate.length]
                action_color.push(color_t)
                $("#action_select").append('<option class="action_select_item" value="'+action_t+'" style="background-color:'+color_t+'">'+action_t+'</option>')
            }
            set_ann_bar(ann_i[i]["start"], ann_i[i]["end"], i, color_t)
        }
        action_now = action_list[0]
        document.getElementById("action_select").style.backgroundColor = action_color[0]
    }
}

function select_video(elemnt) {
    let vid = vids[elemnt.parentElement.value]
    cur_video_id = elemnt.parentElement.value
    
    file_name = vid.split("/")
    set_video_name(file_name[file_name.length-1])

    if (check_change()) {
        if (remove_now.length > 0) {
            remove_now.forEach(remove_idx => {
                ann_all["video"][remove_idx]["action"] = ann_all["video"][remove_idx]["action"].filter(e => e["end"] > 0)
            })
        }
        remove_now = []
        loading_flag = true
        setProgress(0)
        change_video(vid)
    }
}

vPlayer = videojs('video', {
    autoplay: true,
    playbackRates: [0.5, 1, 1.5, 2],
    controlBar: {
        pictureInPictureToggle: false,
        volumePanel: {
            inline: false,
            volumeControl: {
                vertical: true
            }
        },
        fullscreenToggle: false,
    },
    sources: [{
        type: "video/mp4",
        src: "./test.mp4"
    }]
})
vPlayer.on('ready', function() {
    init()
})

function load_project() {
    vids = []
    ann_all = {"video": []}
    action_list = []
    action_color = []
    color_now = "violet"
    duration = 0
    
    cur_video_id = 0

    let video_count = 0
    
    document.querySelectorAll('.video_list_i').forEach(e => e.remove())
    document.querySelectorAll('.ann_text').forEach(e => e.remove())
    document.querySelectorAll('.action_select_item').forEach(e => e.remove())

    dialog.showOpenDialog({
        title:'select video directory',
        buttonLabel:'select',
        properties: ['openDirectory']
    }).then((result)=>{ 
        if(!result.canceled)
        {
            json_root = result.filePaths[0]
            storage.setDataPath(json_root)
            document.getElementById("json_root").textContent = json_root
            fs.readdir(result.filePaths[0], (err, files) => {
                for (let i=0; i<files.length; i++) {
                    let vid = result.filePaths[0] + "/" + files[i]
                    fileExtension = vid.replace(/^.*\./, '')
                    let file_name = ""
                    if (fileExtension === "mp4") {
                        vids.push(vid)
                    
                        let li_t = document.createElement("li")
                        li_t.id = "video_"+video_count.toString()
                        li_t.className = "video_list_i"
                        li_t.value = video_count
                
                        file_name = vid.split("/")
                        ann_all["video"].push({"name": file_name[file_name.length-1], "action": [], "duration": 0})
                        
                        $('#navigation').append(li_t)
                        $('#'+li_t.id).append('<a href="#" onclick="select_video(this)">' + file_name[file_name.length-1] + '</a>')
                        video_count += 1
                    }
                }
                if (fs.existsSync(json_root+`/annotations.json`)) {
                    console.log("annotations.json avaliable")
                    storage.get('annotations.json', function(error, data) {
                        if (error) throw error;
                        console.log("load annotations.json")
                        // copy exist annotation
                        for (let j=0; j<data["video"].length; j++) {
                            for (let k=0; k<ann_all["video"].length; k++) {
                                if (data["video"][j]["name"] === ann_all["video"][k]["name"]) {
                                    ann_all["video"][k] = data["video"][j]
                                }
                            }
                        }
                        if (vids.length > 0) {
                            let file_name = vids[0].split("/")
                            set_video_name(file_name[file_name.length-1])
                            check_change()
                            loading_flag = true
                            setProgress(0)
                            change_video(vids[0])
                        } else {
                            ann_all["video"].push({"name": "video_name", "action": [], "duration": 0})
                        }
                    });
                } else {
                    if (ann_all["video"].length < 1) {
                        // selected directory doesn't have any mp4 video, the default test one is going to play continue, but the test annotation has been removed
                        ann_all["video"].push({"name": "video_name", "action": [], "duration": 0})
                    } else {
                        // there is no annotations.json, display first video
                        cur_video_id = 0
                        
                        let file_name = vids[0].split("/")
                        set_video_name(file_name[file_name.length-1])

                        if (check_change()) {
                            // load anntation
                            loading_flag = true
                            setProgress(0)
                            change_video(vids[0])
                        }
                    }
                }
            })
        }
    })
}

function color_change(elemnt) {
    color_now = elemnt.value
    elemnt.style.backgroundColor = color_now
}

function get_action_idx(act) {
    return action_list.findIndex(element => element == act)
}

function action_change(elemnt) {
    action_now = elemnt.value
    let tE = document.getElementById("text_action_category")
    tE.value = action_now
    let action_idx = get_action_idx(action_now)
    color_now = action_color[action_idx]
    document.getElementById("action_select").style.backgroundColor = color_now
    document.getElementById("color_select").selectedIndex = color_plate.findIndex(element => element == color_now)
    document.getElementById("color_select").style.backgroundColor = color_now
}

// stop video
Mousetrap.bind('space', () => {
    if (vPlayer.paused()) {
        vPlayer.play()
    } else {
        vPlayer.pause()
    }
})