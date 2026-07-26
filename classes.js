class Sprite {
  constructor({
    position,
    velocity,
    image,
    frames = { max: 1, hold: 10 },
    sprites,
    animate = false,
    rotation = 0,
    scale = 1
  }) {
    this.position = position
    this.image = new Image()
    this.frames = { ...frames, val: 0, elapsed: 0 }
    this.image.onload = () => {
      this.width = (this.image.width / this.frames.max) * scale
      this.height = this.image.height * scale
    }
    this.image.src = image.src

    this.animate = animate
    this.sprites = sprites
    this.opacity = 1

    this.rotation = rotation
    this.scale = scale
  }

  draw() {
    c.save()
    c.translate(
      this.position.x + this.width / 2,
      this.position.y + this.height / 2
    )
    c.rotate(this.rotation)
    c.translate(
      -this.position.x - this.width / 2,
      -this.position.y - this.height / 2
    )
    c.globalAlpha = this.opacity

    const crop = {
      position: {
        x: this.frames.val * (this.width / this.scale),
        y: 0
      },
      width: this.image.width / this.frames.max,
      height: this.image.height
    }

    const image = {
      position: {
        x: this.position.x,
        y: this.position.y
      },
      width: this.image.width / this.frames.max,
      height: this.image.height
    }

    c.drawImage(
      this.image,
      crop.position.x,
      crop.position.y,
      crop.width,
      crop.height,
      image.position.x,
      image.position.y,
      image.width * this.scale,
      image.height * this.scale
    )

    c.restore()

    if (!this.animate) return

    if (this.frames.max > 1) {
      this.frames.elapsed++
    }

    if (this.frames.elapsed % this.frames.hold === 0) {
      if (this.frames.val < this.frames.max - 1) this.frames.val++
      else this.frames.val = 0
    }
  }
}

class Monster extends Sprite {
  constructor({
    position,
    velocity,
    image,
    frames = { max: 1, hold: 10 },
    sprites,
    animate = false,
    rotation = 0,
    isEnemy = false,
    name,
    attacks
  }) {
    super({
      position,
      velocity,
      image,
      frames,
      sprites,
      animate,
      rotation
    })
    this.health = 100
    this.maxHealth = 100
    this.level = 1
    this.exp = 0
    this.attackBonus = 0
    this.isEnemy = isEnemy
    this.name = name
    this.attacks = attacks
  }

  faint() {
    document.querySelector('#dialogueBox').innerHTML = this.name + ' fainted!'
    gsap.to(this.position, {
      y: this.position.y + 20
    })
    gsap.to(this, {
      opacity: 0
    })
    audio.battle.stop()
    audio.victory.play()
  }

  gainExp(amount) {
    this.exp += amount

    if (this.exp >= 100) {
      this.exp = 0
      this.level++
      this.maxHealth += 20
      this.health = this.maxHealth
      this.attackBonus += 5

      document.querySelector("#dialougeBox").innerHTML =
        '$(this.name reached Level $(this.level)!'

    }

  }

  showDamage(damage, recipient) {
    const damageText = document.createElement("div");

  damageText.innerHTML = "-" + damage;

  damageText.style.position = "absolute";
  damageText.style.left = recipient.position.x + "px";
  damageText.style.top = recipient.position.y + "px";
  if (damage >= 50) {
    damageText.style.color = "orange"
  } else {
    damageText.style.color = "red"
  }
  damageText.style.fontSize = "22px";
  damageText.style.fontWeight = "bold";
  damageText.style.pointerEvents = "none";

  document.querySelector("#damageContainer").appendChild(damageText);

    gsap.to(damageText, {
      y: -40,
      opactiy: 0,
      diration: 0.8,
      onComplete() {
        damageText.remove();

      }

  });

}

  attack({ attack, recipient, renderedSprites }) {
    document.querySelector('#dialogueBox').style.display = 'block'
    document.querySelector('#dialogueBox').innerHTML =
      this.name + ' used ' + attack.name

    let healthBar = '#enemyHealthBar'
    if (this.isEnemy) healthBar = '#playerHealthBar'

    let rotation = 1
    if (this.isEnemy) rotation = -2.2

    const critical = Math.random() < 0.2 // 20% chance

      let damage = attack.damage + this.attackBonus

      if (critical) {
        damage *= 2

        document.querySelector("#dialogueBox").innerHTML =
          `${this.name} used ${attack.name}! 🔥 CRITICAL HIT!`
      }

      recipient.health -= damage

    recipient.health = Math.max(0, recipient.health)

    function updateHealthBar() {
      const bar  = document.querySelector(
        recipient.isEnemy ? "#enemyHealthBar" : "#playerHealthBar"

      )

      if (recipient.health > 60) {
        bar.style.backgroundColor = "limegreen"
      } else if (recipient.health > 30) {
        bar.style.backgroundColor = "gold"
      } else {
        bar.style.backgroundColor = "red"
      }

    }

    switch (attack.name) {
      case 'Fireball':
        audio.initFireball.play()
        this.showDamage(damage, recipient)
        const fireballImage = new Image()
        fireballImage.src = './img/fireball.png'
        const fireball = new Sprite({
          position: {
            x: this.position.x,
            y: this.position.y
          },
          image: fireballImage,
          frames: {
            max: 4,
            hold: 10
          },
          animate: true,
          rotation
        })
        renderedSprites.splice(1, 0, fireball)

        gsap.to(fireball.position, {
          x: recipient.position.x,
          y: recipient.position.y,
          onComplete: () => {
            // Enemy actually gets hit
            audio.fireballHit.play()
            this.showDamage(damage, recipient)
            gsap.to(healthBar, {
              width: recipient.health + '%'
            })

            updateHealthBar()

          if (recipient.isEnemy) {
            document.querySelector("#enemyHPText").innerHTML =
              `${recipient.health}/100 HP`
          } else {
            document.querySelector("#playerHPText").innerHTML =
              `${recipient.health}/100 HP`
          }

            gsap.to(recipient.position, {
              x: recipient.position.x + 10,
              yoyo: true,
              repeat: 5,
              duration: 0.08
            })

            gsap.to(recipient, {
              opacity: 0,
              repeat: 5,
              yoyo: true,
              duration: 0.08
            })
            renderedSprites.splice(1, 1)
          }
        })

        break
      case 'Tackle':
        const tl = gsap.timeline()

        let movementDistance = 20
        if (this.isEnemy) movementDistance = -20

        tl.to(this.position, {
          x: this.position.x - movementDistance
        })
          .to(this.position, {
            x: this.position.x + movementDistance * 2,
            duration: 0.1,
            onComplete: () => {
              // Enemy actually gets hit
              audio.tackleHit.play()
              gsap.to(healthBar, {
                width: recipient.health + '%'
              })

              updateHealthBar()

              if (recipient.isEnemy) {
                document.querySelector("#enemyHPText").innerHTML =
                  `${recipient.health}/100 HP`
              } else {
                document.querySelector("#playerHPText").innerHTML =
                  `${recipient.health}/100 HP`
              }

              gsap.to(recipient.position, {
                x: recipient.position.x + 10,
                yoyo: true,
                repeat: 5,
                duration: 0.08
              })

              gsap.to(recipient, {
                opacity: 0,
                repeat: 5,
                yoyo: true,
                duration: 0.08
              })
            }
          })
          .to(this.position, {
            x: this.position.x
          })
        break
    }
  }
}

class Boundary {
  static width = 48
  static height = 48
  constructor({ position }) {
    this.position = position
    this.width = 48
    this.height = 48
  }

  draw() {
    c.fillStyle = 'rgba(255, 0, 0, 0)'
    c.fillRect(this.position.x, this.position.y, this.width, this.height)
  }
}

class Character extends Sprite {
  constructor({
    position,
    velocity,
    image,
    frames = { max: 1, hold: 10 },
    sprites,
    animate = false,
    rotation = 0,
    scale = 1,
    dialogue = ['']
  }) {
    super({
      position,
      velocity,
      image,
      frames,
      sprites,
      animate,
      rotation,
      scale
    })

    this.dialogue = dialogue
    this.dialogueIndex = 0
  }
}