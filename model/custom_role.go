package model

import (
	"github.com/QuantumNous/new-api/common"

	"gorm.io/gorm"
)

type CustomRole struct {
	Id          int            `json:"id"`
	Name        string         `json:"name" gorm:"size:128;not null"`
	Code        string         `json:"code" gorm:"size:64;not null;uniqueIndex:uk_custom_role_code_delete_at,priority:1"`
	Description string         `json:"description,omitempty" gorm:"type:text"`
	Status      int            `json:"status" gorm:"default:1"`
	CreatedTime int64          `json:"created_time" gorm:"bigint"`
	UpdatedTime int64          `json:"updated_time" gorm:"bigint"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index;uniqueIndex:uk_custom_role_code_delete_at,priority:2"`
}

func (CustomRole) TableName() string {
	return "custom_roles"
}

func (r *CustomRole) Insert() error {
	now := common.GetTimestamp()
	r.CreatedTime = now
	r.UpdatedTime = now
	return DB.Create(r).Error
}

func (r *CustomRole) Update() error {
	r.UpdatedTime = common.GetTimestamp()
	return DB.Save(r).Error
}

func IsCustomRoleCodeDuplicated(id int, code string) (bool, error) {
	if code == "" {
		return false, nil
	}
	var cnt int64
	err := DB.Model(&CustomRole{}).Where("code = ? AND id <> ?", code, id).Count(&cnt).Error
	return cnt > 0, err
}

func GetCustomRoleByID(id int) (*CustomRole, error) {
	var r CustomRole
	err := DB.First(&r, id).Error
	if err != nil {
		return nil, err
	}
	return &r, nil
}

func GetAllCustomRoles(offset int, limit int) ([]*CustomRole, int64, error) {
	var roles []*CustomRole
	var total int64
	if err := DB.Model(&CustomRole{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	if err := DB.Offset(offset).Limit(limit).Order("id DESC").Find(&roles).Error; err != nil {
		return nil, 0, err
	}
	return roles, total, nil
}

func SearchCustomRoles(keyword string, offset int, limit int) ([]*CustomRole, int64, error) {
	db := DB.Model(&CustomRole{})
	if keyword != "" {
		like := "%" + keyword + "%"
		db = db.Where("name LIKE ? OR code LIKE ? OR description LIKE ?", like, like, like)
	}
	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var roles []*CustomRole
	if err := db.Offset(offset).Limit(limit).Order("id DESC").Find(&roles).Error; err != nil {
		return nil, 0, err
	}
	return roles, total, nil
}

func DeleteCustomRoleByID(id int) error {
	return DB.Delete(&CustomRole{Id: id}).Error
}
