using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
public class placement : MonoBehaviour
{

    public GameObject place1;
    public GameObject place2;

    public GameObject indicator;

    public Text text;
    
    void Start()
    {
        
        place1.SetActive(false);
        place2.SetActive(false);
    }

    void Update()
    {
        if (Input.touchCount > 0)
        {
            Touch touch = Input.touches[0];
            if (touch.phase == TouchPhase.Began)
            {
                place1.transform.position = indicator.transform.position;
                place1.SetActive(true);
            }else if (touch.phase ==TouchPhase.Stationary)
            {
                text.text ="Mesafe : "+Vector3.Distance(place1.transform.position,place2.transform.position).ToString("F2");
                place2.transform.position = indicator.transform.position;
                place2.SetActive(true);
            }
        }
        else
        {
            place1.SetActive(false);
            place2.SetActive(false);

        }
    }
}
